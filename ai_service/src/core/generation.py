"""Generation: build prompt từ template + gọi Gemini streaming.

Mục 3.3 plan:
  - 3 file prompt (health/shopping/chitchat) load lúc import.
  - Substitute placeholders: {documents}, {products}, {question}, {message},
    {history}.
  - Streaming token (Gemini Flash).
  - Trả về generator + final text.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from pathlib import Path
from typing import AsyncIterator, Optional

logger = logging.getLogger(__name__)

_PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def _load_prompt(name: str) -> str:
    path = _PROMPTS_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {path}")
    return path.read_text(encoding="utf-8")


# Load lúc module import (3 file luôn có sẵn theo plan)
_PROMPTS: dict[str, str] = {
    "health": _load_prompt("health.txt"),
    "shopping": _load_prompt("shopping.txt"),
    "chitchat": _load_prompt("chitchat.txt"),
}


def format_history(messages: list[dict]) -> str:
    """Format conversation history thành text dễ đọc."""
    if not messages:
        return "(chưa có hội thoại trước đó)"
    lines: list[str] = []
    for msg in messages[-6:]:  # giữ 6 turn gần nhất
        role = "Người dùng" if msg["role"] == "user" else "Trợ lý"
        lines.append(f"{role}: {msg['content']}")
    return "\n".join(lines)


def build_health_prompt(
    question: str,
    documents: list[dict],
    history: list[dict],
) -> str:
    """Build prompt cho luồng health.

    documents: list các dict có keys 'article_title', 'section_title', 'content'.
    """
    if documents:
        doc_blocks = []
        for i, doc in enumerate(documents, 1):
            doc_blocks.append(
                f"[Tài liệu {i}]\n"
                f"Tiêu đề: {doc.get('article_title', '')}\n"
                f"Phần: {doc.get('section_title', '')}\n"
                f"Nội dung: {doc.get('content', '')}\n"
            )
        documents_text = "\n".join(doc_blocks)
    else:
        documents_text = "(Không có tài liệu liên quan)"

    return _PROMPTS["health"].format(
        documents=documents_text,
        question=question,
        history=format_history(history),
    )


def build_shopping_prompt(
    question: str,
    products: list[dict],
    history: list[dict],
) -> str:
    """Build prompt cho luồng shopping."""
    if products:
        prod_blocks = []
        for i, p in enumerate(products, 1):
            price = p.get("min_price", 0) or 0
            price_str = f"{price:,.0f}đ" if price else "Liên hệ"
            tags = ", ".join(p.get("tags") or []) or "-"
            desc = (p.get("description") or "")[:300]
            prod_blocks.append(
                f"[Sản phẩm {i}]\n"
                f"Tên: {p.get('name', '')}\n"
                f"Giá: {price_str}\n"
                f"Danh mục: {p.get('category_name', '')}\n"
                f"Tags: {tags}\n"
                f"Mô tả: {desc}\n"
                f"Còn hàng: {p.get('total_stock', 0)}\n"
            )
        products_text = "\n".join(prod_blocks)
    else:
        products_text = "(Không có sản phẩm phù hợp trong hệ thống)"

    return _PROMPTS["shopping"].format(
        products=products_text,
        question=question,
        history=format_history(history),
    )


def build_chitchat_prompt(
    message: str,
    history: list[dict],
) -> str:
    """Build prompt cho luồng chitchat."""
    return _PROMPTS["chitchat"].format(
        message=message,
        history=format_history(history),
    )


# ── Streaming generation ──────────────────────────────────────────────────
@dataclass
class GenerationChunk:
    """Một token từ streaming response."""
    text: str
    done: bool = False
    final_text: str = ""  # chỉ set khi done=True


async def stream_generate(
    intent: str,
    prompt: str,
    gemini_client: object,
    temperature: float = 0.4,
    max_tokens: int = 1024,
) -> AsyncIterator[GenerationChunk]:
    """Stream token từ Gemini.

    Args:
        intent: "health"|"shopping"|"chitchat" (chỉ để log).
        prompt: prompt đã format.
        gemini_client: instance của GeminiClient (có method `stream_generate`).
    """
    logger.debug("Generating for intent=%s, prompt_len=%d", intent, len(prompt))
    buffer: list[str] = []
    try:
        async for token in gemini_client.stream_generate(
            prompt=prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        ):
            buffer.append(token)
            yield GenerationChunk(text=token, done=False)
    except Exception as exc:
        logger.exception("Generation failed: %s", exc)
        yield GenerationChunk(text="", done=True, final_text="")
        return

    final = "".join(buffer)
    yield GenerationChunk(text="", done=True, final_text=final)
