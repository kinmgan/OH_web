"""Pydantic schemas cho Chat API request/response.

Mục 4.2 plan:
  POST /chat
  Request:  { session_id, user_id?, message, stream }
  Response: { session_id, intent, answer, citations[], products[] }
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


IntentType = Literal["health", "shopping", "chitchat"]


class ChatRequest(BaseModel):
    """Request cho POST /chat và /chat/stream."""

    session_id: str = Field(..., min_length=1, max_length=128, description="UUID v4")
    user_id: Optional[int] = Field(
        None,
        description="Optional - user đăng nhập (lấy từ JWT phía BE)",
    )
    message: str = Field(..., min_length=1, max_length=2000, description="Câu hỏi user")
    stream: bool = Field(False, description="True = SSE streaming")


class Citation(BaseModel):
    """Một trích dẫn từ bài viết y khoa (chỉ xuất hiện ở intent=health)."""

    title: str
    section: str = ""
    url: str = ""
    source: str = ""
    score: float = 0.0


class ProductSummary(BaseModel):
    """Một sản phẩm được gợi ý (chỉ xuất hiện ở intent=shopping)."""

    product_id: int
    name: str
    description: str = ""
    min_price: float = 0.0
    category_name: str = ""
    category_id: Optional[int] = None
    total_stock: int = 0
    average_rating: Optional[float] = None
    sold_quantity: int = 0
    tags: list[str] = []
    sku: str = ""


class ChatResponse(BaseModel):
    """Response cho POST /chat (non-stream)."""

    session_id: str
    intent: IntentType
    confidence: float = 0.0
    answer: str
    citations: list[Citation] = []
    products: list[ProductSummary] = []
    debug: Optional[dict] = None


# ── Streaming chunks ──────────────────────────────────────────────────────
class StreamTokenEvent(BaseModel):
    """SSE event: một token từ Gemini."""

    token: str
    done: bool = False


class StreamFinalEvent(BaseModel):
    """SSE event cuối: gửi kèm citations/products + intent."""

    done: bool = True
    intent: IntentType
    confidence: float = 0.0
    citations: list[Citation] = []
    products: list[ProductSummary] = []


class HealthCheckResponse(BaseModel):
    """Response cho GET /health."""

    status: str = "ok"
    qdrant_reachable: bool = False
    qdrant_collections: list[str] = []
    qdrant_points: dict[str, int] = {}
    gemini_configured: bool = False
    be_reachable: Optional[bool] = None
    embedding_model: str = ""
    timestamp: str = ""


# ── Error response ────────────────────────────────────────────────────────
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
