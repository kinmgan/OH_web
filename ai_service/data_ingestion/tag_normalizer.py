"""Tag normalization + classification for product ingestion.

Evidence-based rules derived from probe of 431 products, 1325 tag occurrences:

  - 427 unique tags. Top occurrences:
      Thanh nhiệt (73), dau_nhuc_xuong_khop (59), dong_y_co_dien (54),
      ho (45), Giải độc (44), Bổ Dương (42), chi_khai (28),
      thanh_nhiet (27), cam_mao (24), tieu_dom (20)...

  - Same conceptual tag appears in 4-5 forms:
      "Thanh nhiệt", "thanh nhiệt", "thanh_nhiet", "thanh_nhiệt", "Thanh Nhiệt"
    → keep ALL variants but emit a `canonical` key for grouping.

  - Tags fall into 4 buckets:
      1. TCM action      : Bổ Khí, Thanh nhiệt, Hoạt huyết, Lợi niệu...
      2. TCM/Western symptom: ho, viêm họng, đau đầu, sốt, suyễn, khan_tieng...
      3. Meta/system     : dong_y_co_dien, dong_y_viet_nam, thong_y...
      4. Category-like   : nam khoa, phụ khoa...

Public API:
    normalize_tags(raw_tags) -> TagGroups
        Returns dict with keys: tcm_actions, symptoms, meta, category,
        plus 'raw' (list of original strings) and 'canonical' (deduped forms).
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field


# ─────────────────────────────────────────────────────────────────────────────
# Whitelist built from probe_report.json (only items with count >= 2)
# ─────────────────────────────────────────────────────────────────────────────

# Meta/system tags: describe the product's tradition/source, NOT a function
META_TAGS = frozenset({
    "dong_y_co_dien", "dong y co dien", "dong_y_viet_nam", "dong y viet nam",
    "thong_y", "thong y", "y_hoc_co_truyen", "y hoc co truyen",
    # Older alternative seen in description text
    "y_hoc_co_truyen",
})

# Category-like tags: align with the 6 top-level categories
CATEGORY_TAGS = frozenset({
    "nam khoa", "phụ khoa", "nam_khoa", "phu_khoa",
    "trị u xơ", "tri_u_xơ", "tiền liệt tuyến", "tien_liet_tuyen",
})

# TCM symptom markers — these flag a condition being TREATED, not an action.
# Source: tags where users typically search with this exact word.
SYMPTOM_KEYWORDS = frozenset({
    # respiratory
    "ho", "viêm họng", "viem_hong", "viêm phế quản", "viem_phe_quan",
    "cảm mạo", "cam_mao", "suyễn", "suyen", "bình suyễn", "binh_suyen",
    "ho ra máu", "ho_ra_mau", "khàn tiếng", "khan_tieng",
    # pain
    "đau đầu", "dau_dau", "đau lưng nhức mỏi", "đau_lưng_nhức_mỏi",
    "đau nhức xương khớp", "dau_nhuc_xuong_khop", "đau_nhức_xương_khớp",
    "tê bàn tay chân", "te_ban_tay_chan",
    # GI
    "đau họng", "dau_hong", "khó tiêu", "kho_tieu",
    # skin
    "trị ngứa", "tri_ngua", "mụn nhọt", "mun_nhot",
    "mẩn ngứa", "man_ngua",
    # metabolic
    "hạ sốt", "ha_sot", "gout", "trị gout", "tri_gout",
    "hạ cholesterol", "hạ huyết áp",
    # reproductive
    "di tinh", "mộng tinh", "yếu sinh lý",
    # cancer-related
    "ung thư", "ung_thu", "kháng u", "kháng viêm", "kháng khuẩn",
    "tiêu viêm", "tieu_viem",
    # obstetric
    "an thai", "an_thai", "động thai",
})

# Words that strongly indicate an "action" — i.e. what the drug DOES
ACTION_KEYWORDS = frozenset({
    # Tứ thuốc (4 natures): ôn, lương, nhiệt, hàn (we rarely see these as tags,
    # but kept for safety)
    # Bổ family
    "bổ khí", "bổ huyết", "bổ âm", "bổ dương", "bổ thận",
    "ích khí", "ích huyết", "ích tinh",
    "dưỡng âm", "dưỡng huyết", "dưỡng vị",
    "tư âm", "tư bổ", "đại bổ nguyên khí",
    "tráng dương", "ôn thận", "trợ dương", "cố tinh", "sáp tinh", "ích tinh",
    "tăng sinh lý", "cường dương",
    # Thanh / giải family
    "thanh nhiệt", "giải độc", "giải thử", "tả hỏa", "lương huyết",
    # Hành / hoạt / thông
    "hành khí", "hoạt huyết", "thông kinh", "thông lạc", "thông mạch",
    "lý khí", "phá khí", "giáng nghịch", "sơ can", "bình can",
    # Chỉ / cầm / sáp family (stop-bleeding, stop-pain, astringe)
    "chỉ huyết", "chỉ thống", "chỉ khái", "chỉ tả", "chỉ ẩu",
    "chỉ ngứa", "chỉ hãn", "chỉ khát", "chỉ đới", "chỉ lỵ",
    "cầm máu", "cầm mồ hôi",
    # Lợi family
    "lợi niệu", "lợi tiểu", "lợi thủy", "lợi mật", "lợi sữa", "lợi yết",
    "lợi gan mật", "thông sữa", "thông tiện", "nhuận tràng",
    # Tán / khứ / trừ
    "tán hàn", "tán ứ", "tán kết", "tán phong", "trừ phong", "trừ thấp",
    "khứ phong", "khử ứ", "khu phong",
    # Hóa family
    "hóa đàm", "hóa thấp", "hóa tích", "tiêu đờm", "tiêu tích", "tiêu thực",
    "tiêu độc", "tiêu viêm", "tiêu thũng", "tiêu ung", "tiêu bỉ",
    # Phát / giải / ôn
    "phát hãn", "giải biểu", "giải cơ", "giải cảm", "ôn trung", "ôn kinh",
    # Tư âm / sinh tân
    "sinh tân", "minh mục", "sáng mắt", "an thần", "trừ phiền",
    # Cố / sáp
    "sáp niệu", "sáp trường",
    # Khai / thông / hạ
    "khai khiếu", "hạ khí", "nạp khí", "phục hồi",
    # Bổ cân / cường cân
    "cường cân cốt", "mạnh gân cốt",
    # Hỗ trợ / ổn định (mixed Western-friendly)
    "hỗ trợ xương khớp", "kích thích tiêu hóa",
    "ổn định đường huyết", "hạ đường huyết",
})


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def _strip_diacritics(s: str) -> str:
    """Bỏ dấu tiếng Việt → ASCII."""
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def _canonical(s: str) -> str:
    """Canonical form: lowercase, bỏ dấu, bỏ gạch dưới, collapse spaces."""
    return re.sub(r"\s+", " ", _strip_diacritics(s).lower().replace("_", " ")).strip()


def _normalize_string(s: str) -> str:
    """Lowercase + collapse spaces + bỏ gạch dưới (giữ dấu)."""
    return re.sub(r"\s+", " ", s.lower().replace("_", " ")).strip()


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────


@dataclass
class TagGroups:
    """Result of normalize_tags()."""
    tcm_actions: list[str] = field(default_factory=list)
    symptoms: list[str] = field(default_factory=list)
    meta: list[str] = field(default_factory=list)
    category_like: list[str] = field(default_factory=list)
    raw: list[str] = field(default_factory=list)
    canonical_keys: list[str] = field(default_factory=list)


def _classify(tag: str) -> str:
    """Classify a single tag into one of the 4 buckets.

    Order of precedence:
      1. meta  (if in META_TAGS after normalization)
      2. category-like (if in CATEGORY_TAGS)
      3. symptom (if tag's canonical form is in SYMPTOM_KEYWORDS' canonicals
                   OR ends with a symptom-ish word)
      4. action (default — most tags fall here)
    """
    t = _normalize_string(tag)
    canon = _canonical(tag)

    if canon in META_TAGS:
        return "meta"
    if canon in CATEGORY_TAGS:
        return "category"
    if canon in {_canonical(k) for k in SYMPTOM_KEYWORDS}:
        return "symptom"
    if canon in {_canonical(k) for k in ACTION_KEYWORDS}:
        return "action"
    return "action"  # default: most tags are TCM actions


def normalize_tags(raw_tags) -> TagGroups:
    """Normalize a list of raw tag strings.

    Accepts: list[str], str (comma-separated), or None.
    Returns: TagGroups with classification + canonical dedup.
    """
    # 1. Coerce to list[str]
    if raw_tags is None:
        raw = []
    elif isinstance(raw_tags, str):
        # Could be JSON, or a single tag, or comma-separated
        raw_str = raw_tags.strip()
        if raw_str.startswith("["):
            import json
            try:
                parsed = json.loads(raw_str)
                raw = [str(t) for t in parsed] if isinstance(parsed, list) else [raw_str]
            except Exception:
                raw = [raw_str]
        else:
            raw = [t.strip() for t in raw_str.split(",") if t.strip()]
    else:
        raw = [str(t) for t in raw_tags]

    groups = TagGroups(raw=raw)

    seen_canonical: set[str] = set()
    for t in raw:
        t_norm = _normalize_string(t)
        if not t_norm:
            continue
        canon = _canonical(t)
        if canon in seen_canonical:
            continue
        seen_canonical.add(canon)

        kind = _classify(t)
        target = {
            "action": groups.tcm_actions,
            "symptom": groups.symptoms,
            "meta": groups.meta,
            "category": groups.category_like,
        }[kind]
        if t_norm in target:
            continue
        target.append(t_norm)
        groups.canonical_keys.append(canon)

    return groups
