"""FastAPI application — main entry point.

Khởi tạo:
  - FastAPI app với CORS cho phép FE + BE.
  - State chứa các singleton (retriever, router, gemini, memory, ...).
  - Register router từ `api/chat.py`.
  - Startup/shutdown events: warm-up models, đóng httpx client.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.chat import router as chat_router
from src.config import get_settings
from src.core.memory import (
    ConversationMemory,
    HealthKeywordUploader,
    get_memory,
)
from src.core.retrieval import Retriever, get_retriever
from src.core.router import IntentRouter
from src.services.embedding_client import EmbeddingClient
from src.services.gemini_client import GeminiClient, get_gemini_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai_service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Quản lý vòng đời ứng dụng."""
    settings = get_settings()
    logger.info("Starting AI Service...")
    logger.info("Qdrant: %s:%d", settings.qdrant_host, settings.qdrant_port)
    logger.info("Collections: %s / %s", settings.collection_articles, settings.collection_products)
    logger.info("Gemini configured: %s", bool(settings.gemini_api_key))

    # Lazy singletons
    app.state.embedding = EmbeddingClient()
    app.state.retriever = get_retriever()
    app.state.gemini = get_gemini_client()
    app.state.memory = get_memory()

    # Router cần gemini_client cho tie-break
    app.state.router = IntentRouter(gemini_client=app.state.gemini)

    # Keyword uploader (fire-and-forget POST sang BE)
    if settings.ai_internal_token:
        app.state.keyword_uploader = HealthKeywordUploader(
            be_base_url=settings.java_backend_url,
            internal_token=settings.ai_internal_token,
        )
        logger.info(
            "Keyword uploader configured for BE: %s",
            settings.java_backend_url,
        )
    else:
        app.state.keyword_uploader = None
        logger.warning(
            "AI_INTERNAL_TOKEN not set - keyword upload disabled"
        )

    logger.info("AI Service started.")

    yield  # ← application runs

    # Cleanup
    logger.info("Shutting down AI Service...")
    try:
        if hasattr(app.state.keyword_uploader, "close"):
            await app.state.keyword_uploader.close()
    except Exception:
        pass
    logger.info("AI Service stopped.")


# ── App factory ────────────────────────────────────────────────────────────
app = FastAPI(
    title="Oriental Herbs AI Service",
    description="RAG chatbot đa luồng (Health / Shopping / Chitchat)",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — cho phép BE + FE gọi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong prod nên restrict lại
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Mount routers
app.include_router(chat_router, tags=["chat"])


@app.get("/")
async def root():
    """Root endpoint để check service còn sống."""
    return {
        "service": "ai-service",
        "version": "0.1.0",
        "endpoints": [
            "POST /chat",
            "POST /chat/stream",
            "GET /health",
            "DELETE /internal/session/{session_id}",
        ],
    }


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "src.main:app",
        host=settings.service_host,
        port=settings.service_port,
        reload=False,
        log_level="info",
    )
