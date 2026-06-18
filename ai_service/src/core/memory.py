"""Conversation memory (RAM-based) + keyword extraction.

Memory:
  - dict[session_id, list[BaseMessage-like dict]] lưu RAM.
  - Tự cắt khi > MAX_MESSAGES messages hoặc > MAX_TOKENS tokens.
  - Mất khi restart (chấp nhận cho MVP).

Keyword Extraction (mục 3.4 plan):
  - Regex match ~30 keyword y khoa từ cả query và response.
  - Fire-and-forget POST sang BE `/api/users/{userId}/health-keywords`.
  - Nếu userId None → skip.

Token counting dùng `tiktoken` với encoding `cl100k_base` (≈ GPT-4 tokenizer).
"""
from __future__ import annotations

import asyncio
import logging
import re
from collections import deque
from dataclasses import dataclass, field
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

MAX_MESSAGES = 20
MAX_TOKENS = 4000

# ── Health keyword list (mục 3.4 plan) ────────────────────────────────────
# Khoảng 30 keyword phổ biến, normalize dấu ở runtime.
HEALTH_KEYWORDS: list[str] = [
    "đau lưng",
    "đau đầu",
    "đau vai gáy",
    "đau cổ",
    "đau khớp",
    "đau nhức xương",
    "mất ngủ",
    "viêm khớp",
    "thoái hóa",
    "thoát vị đĩa đệm",
    "gai cột sống",
    "tim mạch",
    "huyết áp cao",
    "huyết áp thấp",
    "tiểu đường",
    "mỡ máu",
    "gan nhiễm mỡ",
    "suy nhược",
    "rối loạn tiền đình",
    "trầm cảm",
    "lo âu",
    "căng thẳng",
    "táo bón",
    "đau dạ dày",
    "trào ngược",
    "hen suyễn",
    "viêm phổi",
    "cảm cúm",
    "dị ứng",
    "tai biến",
    "đột quỵ",
]

# ── Token counter (lazy load) ─────────────────────────────────────────────
_tokenizer = None


def _count_tokens(text: str) -> int:
    global _tokenizer
    if _tokenizer is None:
        try:
            import tiktoken
            _tokenizer = tiktoken.get_encoding("cl100k_base")
        except Exception:
            _tokenizer = "char_fallback"
    if _tokenizer == "char_fallback":
        # Rough fallback: 1 token ≈ 4 chars
        return max(1, len(text) // 4)
    return len(_tokenizer.encode(text))


def _strip_accents(text: str) -> str:
    import unicodedata
    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


# ── Message dataclass ──────────────────────────────────────────────────────
@dataclass
class Message:
    """Một turn trong hội thoại."""
    role: str  # "user" | "assistant"
    content: str
    tokens: int = 0

    def to_dict(self) -> dict:
        return {"role": self.role, "content": self.content}

    @classmethod
    def from_dict(cls, d: dict) -> "Message":
        msg = cls(role=d["role"], content=d["content"])
        msg.tokens = _count_tokens(msg.content)
        return msg


# ── Memory store ───────────────────────────────────────────────────────────
class ConversationMemory:
    """In-memory conversation buffer (per session)."""

    def __init__(
        self,
        max_messages: int = MAX_MESSAGES,
        max_tokens: int = MAX_TOKENS,
    ):
        self.max_messages = max_messages
        self.max_tokens = max_tokens
        self._store: dict[str, deque[Message]] = {}

    def get(self, session_id: str) -> list[Message]:
        """Lấy lịch sử hội thoại (copy, không ảnh hưởng store)."""
        if session_id not in self._store:
            return []
        return list(self._store[session_id])

    def add(self, session_id: str, message: Message) -> None:
        """Thêm 1 message và tự cắt nếu quá giới hạn."""
        if session_id not in self._store:
            self._store[session_id] = deque(maxlen=self.max_messages)
        message.tokens = _count_tokens(message.content)
        self._store[session_id].append(message)
        self._trim(session_id)

    def _trim(self, session_id: str) -> None:
        """Cắt theo cả message count và total tokens (giữ message mới nhất)."""
        messages = self._store[session_id]
        while len(messages) > self.max_messages:
            messages.popleft()
        total = sum(m.tokens for m in messages)
        while total > self.max_tokens and len(messages) > 1:
            removed = messages.popleft()
            total -= removed.tokens
            logger.debug("Trimmed 1 message from session %s", session_id)

    def clear(self, session_id: str) -> bool:
        """Xóa session. Trả về True nếu có gì để xóa."""
        if session_id in self._store:
            del self._store[session_id]
            return True
        return False

    def stats(self) -> dict:
        return {
            "session_count": len(self._store),
            "total_messages": sum(len(q) for q in self._store.values()),
        }


# ── Keyword extraction ────────────────────────────────────────────────────
@dataclass
class ExtractedKeywords:
    """Keywords trích xuất từ query + response."""
    tags: list[str] = field(default_factory=list)
    matched: dict[str, list[str]] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {"tags": self.tags, "matched": self.matched}


def extract_health_keywords(text: str) -> ExtractedKeywords:
    """Trích xuất keyword y khoa từ text.

    Match không phân biệt dấu (vd: "đau lung" vẫn match "đau lưng").
    Trả về danh sách tag unique, match chi tiết theo từng keyword.
    """
    normalized = _strip_accents(text)
    matched: dict[str, list[str]] = {}
    found_tags: list[str] = []

    for kw in HEALTH_KEYWORDS:
        kw_norm = _strip_accents(kw)
        # Substring match để cover cả "đau lưng dưới", "bị đau lưng", v.v.
        if kw_norm in normalized:
            matched.setdefault("health", []).append(kw)
            if kw not in found_tags:
                found_tags.append(kw)

    return ExtractedKeywords(tags=found_tags, matched=matched)


# ── Fire-and-forget POST sang BE ───────────────────────────────────────────
class HealthKeywordUploader:
    """Gọi BE để lưu health keywords cho user (fire-and-forget)."""

    def __init__(
        self,
        be_base_url: str,
        internal_token: str,
        endpoint_template: str = "/api/users/{user_id}/health-keywords",
        timeout: float = 5.0,
    ):
        self.be_base_url = be_base_url.rstrip("/")
        self.internal_token = internal_token
        self.endpoint_template = endpoint_template
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None

    async def upload(
        self,
        user_id: int,
        tags: list[str],
        conversation_id: Optional[str] = None,
    ) -> bool:
        """Upload tags cho user. Trả về True nếu thành công.

        Không raise exception (fire-and-forget).
        """
        if not tags:
            return False
        if user_id is None:
            logger.debug("Skip upload: user_id is None")
            return False

        url = self.be_base_url + self.endpoint_template.format(user_id=user_id)
        body = {
            "tags": tags,
            "source": "ai_chatbot",
            "conversation_id": conversation_id,
        }
        headers = {
            "X-Internal-Token": self.internal_token,
            "Content-Type": "application/json",
        }

        try:
            client = await self._get_client()
            resp = await client.post(url, json=body, headers=headers)
            if resp.status_code in (200, 201):
                logger.debug(
                    "Uploaded %d health keywords for user %d",
                    len(tags),
                    user_id,
                )
                return True
            else:
                logger.warning(
                    "Upload keywords failed: status=%d body=%s",
                    resp.status_code,
                    resp.text[:200],
                )
                return False
        except Exception as exc:
            logger.warning("Upload keywords exception: %s", exc)
            return False

    def upload_async(
        self,
        user_id: int,
        tags: list[str],
        conversation_id: Optional[str] = None,
    ) -> asyncio.Task:
        """Schedule upload fire-and-forget (không chờ)."""
        return asyncio.create_task(
            self.upload(user_id, tags, conversation_id),
        )


# ── Singleton helpers ─────────────────────────────────────────────────────
_memory_instance: Optional[ConversationMemory] = None


def get_memory() -> ConversationMemory:
    global _memory_instance
    if _memory_instance is None:
        _memory_instance = ConversationMemory()
    return _memory_instance
