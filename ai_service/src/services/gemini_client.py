"""Gemini API client — sync (cho tie-break router) + streaming (cho generation).

Sử dụng google-generativeai SDK trực tiếp (không qua LangChain) để:
  - Sync generate đơn giản cho tie-break.
  - Streaming async-friendly cho generation.

Model: gemini-1.5-flash (đã plan dùng ở BE cũ).
"""
from __future__ import annotations

import asyncio
import logging
import os
from typing import AsyncIterator, Optional

import google.generativeai as genai

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gemini-2.5-flash"


class GeminiClient:
    """Wrapper cho Google Gemini API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = DEFAULT_MODEL,
    ):
        # Ưu tiên tham số → env → settings
        from src.config import get_settings
        settings = get_settings()
        key = api_key or settings.gemini_api_key or os.environ.get("GEMINI_API_KEY", "")
        if not key:
            raise ValueError(
                "GEMINI_API_KEY is required (set in .env or pass api_key=...)"
            )
        genai.configure(api_key=key)
        self.model_name = model_name
        self._model = genai.GenerativeModel(model_name)

    def generate_sync(
        self,
        prompt: str,
        temperature: float = 0.0,
        max_tokens: int = 256,
    ) -> str:
        """Generate đồng bộ (dùng cho tie-break router). Trả về text.

        Raises exception nếu lỗi — caller xử lý.
        """
        generation_config = genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
        response = self._model.generate_content(
            prompt,
            generation_config=generation_config,
        )
        return (response.text or "").strip()

    async def stream_generate(
        self,
        prompt: str,
        temperature: float = 0.4,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        """Stream token async. Yield từng đoạn text.

        Implementation note:
          Gemini 2.5-flash có thinking mode mặc định → stream API chỉ trả
          về 1 chunk đầu tiên (chunk "thoughts"). Ở MVP, ta dùng non-stream
          + tự cắt text thành các chunk nhỏ (~30 ký tự) để giả lập SSE.
          UX vẫn mượt vì Gemini non-stream chỉ mất ~1-3s cho response ngắn.
        """
        loop = asyncio.get_event_loop()

        def _blocking_generate():
            try:
                generation_config = genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                )
                resp = self._model.generate_content(
                    prompt,
                    generation_config=generation_config,
                    stream=False,
                )
                return resp.text or ""
            except Exception as exc:
                logger.exception("Gemini non-stream failed: %s", exc)
                return ""

        full_text = await loop.run_in_executor(None, _blocking_generate)
        if not full_text:
            return

        # Cắt thành các "pseudo-token" ~30 ký tự, ưu tiên cắt theo khoảng trắng.
        chunks = _split_into_chunks(full_text, chunk_size=30)
        for chunk in chunks:
            yield chunk
            # Yield control cho event loop (không block nếu caller cancel)
            await asyncio.sleep(0)

    async def aclose(self):
        """Placeholder để tương thích pattern. Không cần làm gì."""
        return 


# Singleton (lazy)
_gemini_instance: Optional[GeminiClient] = None


def get_gemini_client() -> GeminiClient:
    global _gemini_instance
    if _gemini_instance is None:
        _gemini_instance = GeminiClient()
    return _gemini_instance


def _split_into_chunks(text: str, chunk_size: int = 30) -> list[str]:
    """Cắt text thành các đoạn nhỏ ~chunk_size ký tự, ưu tiên cắt theo
    khoảng trắng / dấu câu để dễ đọc khi stream."""
    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    remaining = text
    while remaining:
        if len(remaining) <= chunk_size:
            chunks.append(remaining)
            break
        # Tìm vị trí cắt tốt nhất trong cửa sổ [chunk_size-5, chunk_size+5]
        best_pos = -1
        for offset in range(-5, 6):
            pos = chunk_size + offset
            if 0 <= pos < len(remaining) and remaining[pos] in " \n\t.!?,":
                best_pos = pos
                break
        if best_pos == -1:
            best_pos = chunk_size
        chunks.append(remaining[:best_pos])
        # Bỏ qua khoảng trắng đầu đoạn tiếp
        remaining = remaining[best_pos:].lstrip()
    return chunks
