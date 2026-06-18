"""Chat API endpoints — /chat, /chat/stream, /health.

Endpoints (mục 4.1 plan):
  - POST /chat           — trả full JSON response.
  - POST /chat/stream    — SSE streaming token.
  - GET  /health         — health check (Qdrant + Gemini).
  - DELETE /internal/session/{session_id} — clear memory.

Auth: tất cả (trừ /health) yêu cầu header `X-Internal-Token: <secret>`.
"""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from src.config import get_settings
from src.core.generation import (
    build_chitchat_prompt,
    build_health_prompt,
    build_shopping_prompt,
    stream_generate,
)
from src.core.guardrails import apply_post_guardrail, apply_pre_guardrail
from src.core.memory import (
    ConversationMemory,
    ExtractedKeywords,
    HealthKeywordUploader,
    Message,
    extract_health_keywords,
    get_memory,
)
from src.core.retrieval import Retriever, get_retriever
from src.core.router import IntentRouter, RouteDecision, get_router
from src.models.chat import (
    ChatRequest,
    ChatResponse,
    Citation,
    HealthCheckResponse,
    ProductSummary,
    StreamFinalEvent,
    StreamTokenEvent,
)
from src.services.embedding_client import EmbeddingClient
from src.services.gemini_client import GeminiClient, get_gemini_client
from src.services.qdrant_client import QdrantService

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Auth dependency ────────────────────────────────────────────────────────
async def verify_internal_token(
    x_internal_token: Optional[str] = Header(None, alias="X-Internal-Token"),
) -> None:
    """Verify X-Internal-Token header. 403 nếu sai."""
    settings = get_settings()
    expected = settings.ai_internal_token if hasattr(settings, "ai_internal_token") else ""
    if not expected:
        # Token chưa set → fail-open trong dev, fail-closed trong prod
        logger.warning(
            "AI_INTERNAL_TOKEN not configured - all requests will be REJECTED"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Internal token not configured",
        )
    if x_internal_token != expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing X-Internal-Token",
        )


# ── Pipeline orchestration ────────────────────────────────────────────────
async def _run_chat_pipeline(
    req: ChatRequest,
    retriever: Retriever,
    router_obj: IntentRouter,
    gemini: GeminiClient,
    memory: ConversationMemory,
    keyword_uploader: Optional[HealthKeywordUploader] = None,
) -> tuple[RouteDecision, str, list[Citation], list[ProductSummary], ExtractedKeywords]:
    """Chạy full pipeline: route → guardrail → retrieve → generate → guardrail → memory.

    Returns: (decision, answer, citations, products, extracted_keywords)
    """
    # 1. Router
    decision = router_obj.route(req.message)

    # 2. Pre-LLM guardrail (prescription → force health + warning)
    final_intent, prefix = apply_pre_guardrail(req.message, decision.intent)
    if prefix:
        # Nếu guardrail override → cập nhật decision để log
        if final_intent != decision.intent:
            decision = RouteDecision(
                intent=final_intent,
                confidence=1.0,
                primary_score=999.0,
                secondary_intent=decision.intent,
                secondary_score=decision.primary_score,
                used_tie_break=False,
                matched_keywords={"__guardrail__": ["prescription"]},
            )

    # 3. Memory load (history)
    history = memory.get(req.session_id)
    history_dicts = [m.to_dict() for m in history]

    # 4. Retrieve (depends on intent)
    retrieval = retriever.retrieve(decision.intent, req.message)

    # 5. Build prompt
    if decision.intent == "health":
        docs = [
            {
                "article_title": h.article_title,
                "section_title": h.section_title,
                "content": h.content,
            }
            for h in retrieval.health_hits
        ]
        prompt = build_health_prompt(
            question=req.message,
            documents=docs,
            history=history_dicts,
        )
    elif decision.intent == "shopping":
        products_data = [
            {
                "name": p.name,
                "min_price": p.min_price,
                "category_name": p.category_name,
                "tags": p.tags,
                "description": p.description,
                "total_stock": p.total_stock,
            }
            for p in retrieval.product_hits
        ]
        prompt = build_shopping_prompt(
            question=req.message,
            products=products_data,
            history=history_dicts,
        )
    else:  # chitchat
        prompt = build_chitchat_prompt(
            message=req.message,
            history=history_dicts,
        )

    # 6. Generate (non-stream ở đây - /chat, /chat/stream dùng streaming riêng)
    full_text = ""
    try:
        async for chunk in stream_generate(
            decision.intent,
            prompt,
            gemini,
            temperature=0.4,
            max_tokens=1024,
        ):
            if chunk.done:
                full_text = chunk.final_text or full_text
            else:
                full_text += chunk.text
    except Exception as exc:
        logger.exception("Gemini generation failed: %s", exc)
        full_text = ""

    # 6.5. Fallback khi Gemini trả rỗng (quota / safety filter / lỗi khác).
    if not full_text or not full_text.strip():
        logger.warning(
            "Gemini returned empty for intent=%s, session=%s — using fallback",
            decision.intent,
            req.session_id,
        )
        if decision.intent == "shopping":
            full_text = (
                "Xin lỗi, hiện tại hệ thống đang gặp sự cố tạm thời. "
                "Bạn có thể xem các sản phẩm trực tiếp tại "
                "https://orientalherbs.vn nhé."
            )
        elif decision.intent == "health":
            full_text = (
                "Xin lỗi, hiện tại hệ thống đang gặp sự cố tạm thời. "
                "Bạn vui lòng tham khảo ý kiến bác sĩ để được tư vấn chính xác nhất."
            )
        else:
            full_text = (
                "Xin chào! Mình là OH Bot, trợ lý ảo của Oriental Herbs. "
                "Hiện tại mình đang gặp chút sự cố, bạn cho mình thử lại sau ít phút nhé."
            )

    # 7. Apply prefix (nếu có) vào đầu response
    if prefix:
        full_text = f"{prefix}\n\n{full_text}"

    # 8. Post-LLM guardrail
    safe_text = apply_post_guardrail(full_text)

    # 9. Build citations / products
    citations = [
        Citation(
            title=h.article_title,
            section=h.section_title,
            url=h.url,
            source=h.source,
            score=h.score,
        )
        for h in retrieval.health_hits
    ]
    products = [
        ProductSummary(
            product_id=p.product_id,
            name=p.name,
            description=p.description,
            min_price=p.min_price,
            category_name=p.category_name,
            category_id=p.category_id,
            total_stock=p.total_stock,
            average_rating=p.average_rating,
            sold_quantity=p.sold_quantity,
            tags=p.tags,
            sku=p.sku,
        )
        for p in retrieval.product_hits
    ]

    # 10. Memory save
    memory.add(req.session_id, Message(role="user", content=req.message))
    memory.add(req.session_id, Message(role="assistant", content=safe_text))

    # 11. Keyword extraction + fire-and-forget upload
    extracted = extract_health_keywords(req.message + " " + safe_text)
    if (
        extracted.tags
        and req.user_id is not None
        and keyword_uploader is not None
    ):
        keyword_uploader.upload_async(
            user_id=req.user_id,
            tags=extracted.tags,
            conversation_id=req.session_id,
        )

    return decision, safe_text, citations, products, extracted


# ── POST /chat ─────────────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def post_chat(
    req: ChatRequest,
    request: Request,
    _: None = Depends(verify_internal_token),
) -> ChatResponse:
    """Trả full JSON response (non-stream)."""
    retriever: Retriever = request.app.state.retriever
    router_obj: IntentRouter = request.app.state.router
    gemini: GeminiClient = request.app.state.gemini
    memory: ConversationMemory = request.app.state.memory
    keyword_uploader: Optional[HealthKeywordUploader] = getattr(
        request.app.state, "keyword_uploader", None
    )

    try:
        decision, answer, citations, products, _ = await _run_chat_pipeline(
            req, retriever, router_obj, gemini, memory, keyword_uploader
        )
    except Exception as exc:
        logger.exception("Chat pipeline failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Chat pipeline error: {exc}")

    return ChatResponse(
        session_id=req.session_id,
        intent=decision.intent,
        confidence=decision.confidence,
        answer=answer,
        citations=citations,
        products=products,
        debug={
            "primary_score": decision.primary_score,
            "secondary_intent": decision.secondary_intent,
            "used_tie_break": decision.used_tie_break,
        },
    )


# ── POST /chat/stream ──────────────────────────────────────────────────────
@router.post("/chat/stream")
async def post_chat_stream(
    req: ChatRequest,
    request: Request,
    _: None = Depends(verify_internal_token),
) -> EventSourceResponse:
    """SSE streaming token."""
    retriever: Retriever = request.app.state.retriever
    router_obj: IntentRouter = request.app.state.router
    gemini: GeminiClient = request.app.state.gemini
    memory: ConversationMemory = request.app.state.memory
    keyword_uploader: Optional[HealthKeywordUploader] = getattr(
        request.app.state, "keyword_uploader", None
    )

    async def event_generator():
        try:
            decision, answer, citations, products, _ = await _run_chat_pipeline(
                req, retriever, router_obj, gemini, memory, keyword_uploader
            )
            # Gửi full answer dưới dạng 1 token duy nhất (vì Gemini stream
            # đã được chia pseudo-chunk ở tầng dưới).
            token_event = StreamTokenEvent(token=answer, done=False)
            yield {"event": "token", "data": token_event.model_dump_json()}
            # Final event
            final = StreamFinalEvent(
                done=True,
                intent=decision.intent,
                confidence=decision.confidence,
                citations=citations,
                products=products,
            )
            yield {"event": "final", "data": final.model_dump_json()}
        except asyncio.CancelledError:
            logger.warning("Client disconnected during stream")
            raise
        except Exception as exc:
            logger.exception("Stream pipeline failed: %s", exc)
            err = {"error": str(exc)}
            yield {"event": "error", "data": json.dumps(err, ensure_ascii=False)}

    return EventSourceResponse(event_generator())


# ── DELETE /internal/session/{session_id} ──────────────────────────────────
@router.delete("/internal/session/{session_id}")
async def delete_session(
    session_id: str,
    _: None = Depends(verify_internal_token),
) -> JSONResponse:
    memory: ConversationMemory = get_memory()
    deleted = memory.clear(session_id)
    return JSONResponse(
        content={"session_id": session_id, "deleted": deleted}
    )


# ── GET /health ────────────────────────────────────────────────────────────
@router.get("/health", response_model=HealthCheckResponse)
async def get_health() -> HealthCheckResponse:
    """Health check (KHÔNG yêu cầu auth)."""
    settings = get_settings()
    qdrant = QdrantService()
    gemini_ok = bool(settings.gemini_api_key)

    qdrant_reachable = False
    collections: list[str] = []
    points_count: dict[str, int] = {}
    try:
        collections = qdrant.list_collections()
        qdrant_reachable = True
        for c in collections:
            info = qdrant.get_collection_info(c)
            if info:
                points_count[c] = info["points_count"]
    except Exception as exc:
        logger.warning("Qdrant health check failed: %s", exc)

    return HealthCheckResponse(
        status="ok" if (qdrant_reachable and gemini_ok) else "degraded",
        qdrant_reachable=qdrant_reachable,
        qdrant_collections=collections,
        qdrant_points=points_count,
        gemini_configured=gemini_ok,
        embedding_model="bkai-foundation-models/vietnamese-bi-encoder",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
