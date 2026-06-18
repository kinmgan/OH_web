"""Intent router — hybrid keyword scoring + Gemini tie-break.

Chiến lược (xem plan_v2.md mục 3.1):
  1. Match keyword từ 3 file (health/shopping/chitchat).
  2. Tính điểm từng luồng = số keyword match (có trọng số theo độ dài keyword).
  3. Nếu primary rõ ràng (>2x secondary) → trả primary.
  4. Nếu tie / không rõ → gọi Gemini mini "Phân loại ý định".
  5. Nếu cả 3 luồng đều < threshold → mặc định chitchat.
"""
from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal, Optional

logger = logging.getLogger(__name__)

IntentType = Literal["health", "shopping", "chitchat"]

# ── Keyword loading ────────────────────────────────────────────────────────
_ROUTES_DIR = Path(__file__).parent.parent / "routes"


def _strip_accents(text: str) -> str:
    """Lowercase + bỏ dấu tiếng Việt để match keyword không phân biệt dấu."""
    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text


def _load_keywords(filename: str) -> list[str]:
    path = _ROUTES_DIR / filename
    if not path.exists():
        logger.warning("Keyword file not found: %s", path)
        return []
    keywords: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            keywords.append(line)
    return keywords


_KEYWORDS: dict[str, list[str]] = {
    "health": _load_keywords("health_keywords.txt"),
    "shopping": _load_keywords("shopping_keywords.txt"),
    "chitchat": _load_keywords("chitchat_keywords.txt"),
}

# Match pattern: whole-word (boundary) cho keyword 1 từ; substring cho multi-word.
_WORD_RE_CACHE: dict[str, re.Pattern[str]] = {}


def _compile_word(keyword: str) -> re.Pattern[str]:
    """Compile regex pattern cho 1 keyword (case-insensitive, no accent)."""
    if keyword in _WORD_RE_CACHE:
        return _WORD_RE_CACHE[keyword]
    stripped = _strip_accents(keyword)
    # Nếu keyword là 1 từ → word boundary; nếu multi-word → substring match
    if " " in stripped or "_" in stripped:
        pattern = re.escape(stripped).replace(r"\_", " ")
    else:
        pattern = r"\b" + re.escape(stripped) + r"\b"
    compiled = re.compile(pattern, re.IGNORECASE)
    _WORD_RE_CACHE[keyword] = compiled
    return compiled


@dataclass
class RouteDecision:
    """Kết quả phân loại ý định."""
    intent: IntentType
    confidence: float
    primary_score: float
    secondary_intent: Optional[IntentType] = None
    secondary_score: float = 0.0
    used_tie_break: bool = False
    matched_keywords: dict[str, list[str]] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "intent": self.intent,
            "confidence": self.confidence,
            "primary_score": self.primary_score,
            "secondary_intent": self.secondary_intent,
            "secondary_score": self.secondary_score,
            "used_tie_break": self.used_tie_break,
            "matched_keywords": self.matched_keywords,
        }


# ── Pre-LLM guardrail patterns (ép luồng health + thêm cảnh báo) ─────────
# Match ca co dau va khong dau: "mua thuốc kê đơn" / "mua thuoc ke don",
# "liều dùng" / "lieu dung", "đơn thuốc" / "don thuoc", etc.
_PRESCRIPTION_PATTERN = re.compile(
    r"(mua\s+thu[oố]c\s+k[eê]\s+d[oơ]n|li[eề]u\s+d[uù]ng|d[oơ]n\s+thu[oố]c|"
    r"k[eê]\s+d[oơ]n|thu[oố]c\s+t[aâ]y|d[oơ]n\s+thu[oố]c\s+t[aâ]y|"
    r"cho\s+t[oô]i\s+d[oơ]n|toa\s+thu[oố]c|prescription|"
    r"lieu\s+dung|don\s+thuoc|ke\s+don)",
    re.IGNORECASE,
)


def _score_intent(query: str, keywords: list[str]) -> tuple[float, list[str]]:
    """Tính điểm cho 1 luồng.

    Trọng số: keyword càng dài càng có trọng số cao (match cụm từ cụ thể
    mạnh hơn match từ đơn lẻ). Tránh trường hợp "có" match 5 keyword
    chiến thắng "đau dây thần kinh liên sườn".
    """
    normalized = _strip_accents(query)
    matched: list[str] = []
    score = 0.0
    for kw in keywords:
        pattern = _compile_word(kw)
        if pattern.search(normalized):
            # Trọng số: 1 cho 1 từ, 2 cho 2 từ, 3 cho 3 từ
            weight = len(kw.split())
            score += weight
            matched.append(kw)
    return score, matched


def _detect_prescription(query: str) -> bool:
    return bool(_PRESCRIPTION_PATTERN.search(query))


def _normalize_intent(raw: str) -> Optional[IntentType]:
    raw = raw.strip().lower()
    if raw in ("health", "y khoa", "sức khỏe"):
        return "health"
    if raw in ("shopping", "mua sắm", "sản phẩm"):
        return "shopping"
    if raw in ("chitchat", "chit chat", "trò chuyện", "xã giao"):
        return "chitchat"
    return None


class IntentRouter:
    """Phân loại ý định người dùng (hybrid keyword + Gemini tie-break)."""

    CONFIDENCE_THRESHOLD = 0.3
    TIE_RATIO = 2.0  # primary phải > 2x secondary mới rõ ràng

    def __init__(self, gemini_client: Optional[object] = None):
        """Args:
            gemini_client: optional `GeminiClient` instance cho tie-break.
                Nếu None → chỉ dùng keyword.
        """
        self.gemini_client = gemini_client

    def route(self, query: str) -> RouteDecision:
        """Phân loại ý định. Trả về `RouteDecision`."""
        if not query or not query.strip():
            return RouteDecision(
                intent="chitchat",
                confidence=0.0,
                primary_score=0.0,
            )

        # Pre-LLM guardrail: nếu query về đơn thuốc → ép luồng health
        if _detect_prescription(query):
            logger.info("Pre-LLM guardrail: prescription detected → health")
            return RouteDecision(
                intent="health",
                confidence=1.0,
                primary_score=999.0,
                matched_keywords={"__guardrail__": ["prescription_pattern"]},
            )

        # Bước 1: keyword scoring
        scores: dict[str, float] = {}
        matches: dict[str, list[str]] = {}
        for intent, keywords in _KEYWORDS.items():
            score, matched = _score_intent(query, keywords)
            scores[intent] = score
            matches[intent] = matched

        primary = max(scores, key=scores.get)  # type: ignore[arg-type]
        primary_score = scores[primary]

        # Bước 2: secondary
        sorted_intents = sorted(scores.items(), key=lambda x: -x[1])
        secondary_intent: Optional[IntentType] = None
        secondary_score = 0.0
        if len(sorted_intents) > 1 and sorted_intents[1][1] > 0:
            secondary_intent = sorted_intents[1][0]
            secondary_score = sorted_intents[1][1]

        # Bước 3: confidence
        # Normalize: score / 5 (≈ một cụm 3-4 keyword) để ra 0-1
        confidence = min(primary_score / 5.0, 1.0)

        # Bước 4: nếu primary_score quá thấp → mặc định chitchat
        if primary_score == 0 or confidence < self.CONFIDENCE_THRESHOLD:
            return RouteDecision(
                intent="chitchat",
                confidence=confidence,
                primary_score=primary_score,
                secondary_intent=secondary_intent,
                secondary_score=secondary_score,
                matched_keywords=matches,
            )

        # Bước 5: tie-break bằng Gemini (nếu có và cần)
        needs_tie_break = False
        if secondary_intent and secondary_score > 0:
            # Tie khi secondary > 50% primary
            if secondary_score >= primary_score * 0.5:
                needs_tie_break = True
            # Hoặc khi primary không dominate (>2x)
            elif primary_score < secondary_score * self.TIE_RATIO:
                needs_tie_break = True

        if needs_tie_break and self.gemini_client is not None:
            try:
                tie_decision = self._gemini_tie_break(query)
                if tie_decision is not None:
                    return RouteDecision(
                        intent=tie_decision,
                        confidence=0.6,
                        primary_score=primary_score,
                        secondary_intent=secondary_intent,
                        secondary_score=secondary_score,
                        used_tie_break=True,
                        matched_keywords=matches,
                    )
            except Exception as exc:
                logger.warning("Tie-break Gemini failed: %s — falling back to keyword", exc)

        return RouteDecision(
            intent=primary,  # type: ignore[arg-type]
            confidence=confidence,
            primary_score=primary_score,
            secondary_intent=secondary_intent,
            secondary_score=secondary_score,
            used_tie_break=False,
            matched_keywords=matches,
        )

    def _gemini_tie_break(self, query: str) -> Optional[IntentType]:
        """Gọi Gemini mini để phân loại khi tie."""
        if self.gemini_client is None:
            return None
        prompt = (
            "Phân loại ý định của câu sau vào ĐÚNG 1 trong 3 nhãn:\n"
            "- health: hỏi về bệnh, triệu chứng, điều trị, thuốc, sức khỏe.\n"
            "- shopping: hỏi về sản phẩm, giá cả, mua bán.\n"
            "- chitchat: xã giao, hỏi thăm, không liên quan đến sức khỏe/sản phẩm.\n\n"
            f"Câu: {query}\n\n"
            "CHỈ trả lời đúng 1 từ: health, shopping, hoặc chitchat."
        )
        result = self.gemini_client.generate_sync(
            prompt,
            temperature=0.0,
            max_tokens=10,
        )
        return _normalize_intent(result)


# Singleton để dùng chung
_router_instance: Optional[IntentRouter] = None


def get_router(gemini_client: Optional[object] = None) -> IntentRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = IntentRouter(gemini_client=gemini_client)
    return _router_instance
