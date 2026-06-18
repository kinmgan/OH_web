"""Pre-LLM và Post-LLM guardrails cho RAG chatbot.

Pre-LLM guardrail (mục 3.3 plan):
  - Nếu query chứa pattern "mua thuốc kê đơn|liều dùng|đơn thuốc" → ép luồng
    Health + thêm prefix "Bạn cần gặp bác sĩ để được kê đơn."

Post-LLM guardrail:
  - Nếu response match pattern "Tôi khuyên bạn nên dùng X" → chèn thêm
    "(Lưu ý: đây chỉ là thông tin tham khảo, bạn nên hỏi ý kiến bác sĩ trước khi dùng.)"
"""
from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass
from typing import Literal

logger = logging.getLogger(__name__)

IntentType = Literal["health", "shopping", "chitchat"]


def _strip_accents(text: str) -> str:
    """Lowercase + bỏ dấu tiếng Việt để match keyword không phân biệt dấu."""
    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text


# ── Pre-LLM patterns ────────────────────────────────────────────────────────
# Match ca co dau va khong dau (vd: "liều dùng" hoac "lieu dung").
_PRESCRIPTION_PATTERNS = [
    re.compile(r"\bmua\s+thu[oố]c\s+k[eê]\s+d[oơ]n\b", re.IGNORECASE),
    re.compile(r"\bli[eề]u\s+d[uù]ng\b", re.IGNORECASE),
    re.compile(r"\bd[oơ]n\s+thu[oố]c\b", re.IGNORECASE),
    re.compile(r"\bd[oơ]n\s+thu[oố]c\s+t[aâ]y\b", re.IGNORECASE),
    re.compile(r"\btoa\s+thu[oố]c\b", re.IGNORECASE),
    re.compile(r"\bk[eê]\s+d[oơ]n\b", re.IGNORECASE),
    re.compile(r"\bcho\s+t[oô]i\s+d[oơ]n\b", re.IGNORECASE),
    re.compile(r"\bthu[oố]c\s+k[eê]\s+d[oơ]n\b", re.IGNORECASE),
    # Pattern khong dau (khi user viet telex/vni)
    re.compile(r"\blieu\s+dung\b", re.IGNORECASE),
    re.compile(r"\bdon\s+thuoc\b", re.IGNORECASE),
    re.compile(r"\bke\s+don\b", re.IGNORECASE),
]

# ── Post-LLM pattern: AI khuyên dùng cụ thể ────────────────────────────────
_RECOMMENDATION_PATTERN = re.compile(
    r"t[oô]i\s+khuy[eê]n\s+b[aạ]n\s+n[eê]n\s+d[uù]ng\s+([^\n]+?)(?=[\.\!\?]\s|\n|$)",
    re.IGNORECASE,
)

PRESCRIPTION_WARNING = (
    "Bạn cần gặp bác sĩ để được tư vấn và kê đơn thuốc phù hợp. "
    "Tôi không thể kê đơn thuốc thay bác sĩ."
)

RECOMMENDATION_WARNING = (
    "(Lưu ý: đây chỉ là thông tin tham khảo, "
    "bạn nên hỏi ý kiến bác sĩ trước khi sử dụng bất kỳ sản phẩm nào.)"
)


@dataclass
class PreGuardrailResult:
    """Kết quả pre-LLM guardrail."""
    is_prescription_query: bool
    forced_intent: IntentType
    prefix: str

    @property
    def should_override_intent(self) -> bool:
        return self.is_prescription_query


def check_prescription(query: str) -> PreGuardrailResult:
    """Kiểm tra query có phải về thuốc kê đơn không.

    Returns PreGuardrailResult với forced_intent="health" và prefix warning
    nếu match.
    """
    for pattern in _PRESCRIPTION_PATTERNS:
        if pattern.search(query):
            logger.info(
                "Pre-LLM guardrail triggered: prescription pattern matched: %s",
                pattern.pattern,
            )
            return PreGuardrailResult(
                is_prescription_query=True,
                forced_intent="health",
                prefix=PRESCRIPTION_WARNING,
            )
    return PreGuardrailResult(
        is_prescription_query=False,
        forced_intent="chitchat",  # placeholder; caller dùng intent gốc
        prefix="",
    )


def check_recommendation(response: str) -> tuple[bool, str]:
    """Kiểm tra response có chứa recommendation không an toàn.

    Returns:
        (has_recommendation, warning_to_append)
    """
    match = _RECOMMENDATION_PATTERN.search(response)
    if match:
        logger.info(
            "Post-LLM guardrail triggered: recommendation detected: '%s'",
            match.group(1).strip()[:80],
        )
        return True, RECOMMENDATION_WARNING
    return False, ""


def apply_pre_guardrail(query: str, intent: IntentType) -> tuple[IntentType, str]:
    """Apply pre-LLM guardrail lên (query, intent).

    Returns (intent_sau_khi_override, prefix_cảnh_báo).
    """
    result = check_prescription(query)
    if result.should_override_intent:
        return result.forced_intent, result.prefix
    return intent, ""


def apply_post_guardrail(response: str) -> str:
    """Apply post-LLM guardrail lên response. Trả về response (đã append warning nếu cần)."""
    has_warn, warning = check_recommendation(response)
    if not has_warn:
        return response

    # Tránh duplicate warning
    if RECOMMENDATION_WARNING in response:
        return response

    # Tìm vị trí kết thúc câu recommendation: regex match cả nhóm dấu chấm/kết thúc.
    match = _RECOMMENDATION_PATTERN.search(response)
    if not match:
        return response + "\n\n" + warning

    # Tìm vị trí kết thúc câu (dấu chấm hoặc newline) SAU match.end()
    insert_pos = match.end()
    # Bỏ qua 1 dấu chấm nếu có ngay sau recommendation (vd: "...dùng X.")
    n_chars = len(response)
    if insert_pos < n_chars and response[insert_pos] in ".!?":
        insert_pos += 1
    # Bỏ qua space sau dấu chấm
    while insert_pos < n_chars and response[insert_pos] == " ":
        insert_pos += 1

    return response[:insert_pos] + "\n\n" + warning + response[insert_pos:] 
