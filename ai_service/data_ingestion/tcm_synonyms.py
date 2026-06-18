"""TCM (Đông y) → user-facing synonym map for product retrieval.

Each entry maps a TCM term that appears in the DB
(product tags + description) → 1+ lay terms a real user would search for.

Every term on the LEFT appears in our DB (verified against probe_report.json:
1325 tag occurrences across 431 products).
Every term on the RIGHT is the kind of phrase users actually search for
(verified against the 5 eval queries in eval_product_retrieval_results.txt).

Format: each value is comma-separated. Lowercase. No trailing punctuation.
"""

# Canonical key is the TCM term (lowercase, no diacritics optional).
# The matcher normalizes both sides.
# Value is comma-separated lay terms.

TCM_SYNONYMS: dict[str, str] = {

    # ──────────────── TỨ BỔ family (4 supplements) ────────────────
    "bổ khí":      "bồi bổ cơ thể, tăng sức đề kháng, mệt mỏi, uể oải, thiếu khí",
    "ích khí":     "bồi bổ cơ thể, tăng sức đề kháng, phục hồi sức lực",
    "đại bổ nguyên khí": "bồi bổ toàn diện, tăng cường sinh lực, suy kiệt",
    "bổ huyết":    "thiếu máu, da xanh xao, hoa mắt chóng mặt, bổ máu",
    "ích huyết":   "bổ máu, tăng cường tuần hoàn",
    "dưỡng huyết": "bổ máu, cải thiện lưu thông máu",
    "bổ âm":       "bồi bổ, âm hư, khô miệng, khô họng, mất ngủ do âm hư",
    "tư âm":       "bồi bổ, cân bằng âm dương, khô táo",
    "dưỡng âm":    "bồi bổ, giảm khô miệng, giảm khô họng",
    "bổ dương":    "bổ thận tráng dương, tăng cường sinh lý nam, yếu sinh lý",
    "tráng dương": "tăng cường sinh lý nam, cường dương, bổ thận",
    "ôn thận":     "bổ thận, ấm thận, tăng cường sinh lý",
    "trợ dương":   "tăng cường sinh lý, bổ dương",
    "cố tinh":     "di tinh, mộng tinh, xuất tinh sớm",
    "sáp tinh":    "giữ tinh, di tinh, mộng tinh",
    "ích tinh":    "bổ tinh, tăng cường sinh lý, hiếm muộn",
    "sinh tinh":   "tăng chất lượng tinh trùng, hiếm muộn",
    "tăng sinh lý":"tăng cường sinh lý nam, bổ thận, cường dương",
    "cường dương": "yếu sinh lý, rối loạn cương dương, liệt dương",
    "sáp niệu":    "tiểu són, tiểu không tự chủ, tiểu đêm nhiều",
    "bổ thận":     "bổ thận, thận yếu, đau lưng mỏi gối, ù tai",
    "bổ can thận": "bổ gan bổ thận, mỏi mắt, đau lưng, ù tai",

    # ──────────────── THANH / GIẢI family (clear heat/detox) ────────────────
    "thanh nhiệt": "hạ sốt, làm mát cơ thể, nóng trong, mụn nhọt, viêm sưng, viêm nhiễm",
    "giải độc":    "thanh lọc cơ thể, giải độc gan, mụn nhọt, dị ứng, mẩn ngứa",
    "giải thử":    "giải nhiệt mùa hè, say nắng, cảm nắng",
    "tả hỏa":      "hạ sốt cao, thanh nhiệt mạnh, viêm cấp",
    "lương huyết": "mát máu, thanh nhiệt huyết, mẩn ngứa, mụn nhọt, ban đỏ",
    "sinh tân":    "sinh nước bọt, giảm khô miệng, giảm khát",
    "chỉ khát":    "giảm khát, hạ đường huyết, tiểu đường",

    # ──────────────── HÀNH / HOẠT / THÔNG (move qi/blood) ────────────────
    "hành khí":    "giảm đầy bụng, ợ hơi, đau bụng do khí trệ, căng tức",
    "lý khí":      "giảm đầy hơi, điều hòa khí, giảm stress",
    "sơ can":      "điều hòa can khí, giảm căng thẳng, đau ngực sườn",
    "bình can":    "điều hòa can, giảm đau đầu do can dương, chóng mặt",
    "giáng nghịch":"giảm nôn, nấc, trào ngược dạ dày",
    "phá khí":     "giảm đầy bụng dữ dội, khí trệ nặng",
    "hoạt huyết": "cải thiện lưu thông máu, giảm đau do ứ huyết, bầm tím",
    "hoạt huyết hóa ứ": "cải thiện lưu thông máu, tan ứ huyết, giảm đau bụng kinh, bầm tím",
    "thông kinh":  "thông kinh lạc, giảm đau nhức, tê bì",
    "thông lạc":   "thông kinh lạc, giảm tê bì chân tay",
    "thông mạch":  "cải thiện tuần hoàn, thông mạch máu",
    "phá huyết":   "tan huyết ứ, giảm đau bụng kinh",
    "sáp trường":  "chống tiêu chảy, làm săn ruột, kiết lỵ, tiêu chảy lâu ngày",
    "sát trùng":   "kháng khuẩn, diệt khuẩn, chống nhiễm trùng, sát trùng vết thương",

    # ──────────────── CHỈ / CẦM / SÁP (stop, astringe) ────────────────
    "chỉ huyết":   "cầm máu, chảy máu cam, ho ra máu, xuất huyết",
    "cầm máu":     "cầm máu vết thương, chảy máu cam",
    "chỉ thống":   "giảm đau, giảm đau nhức",
    "chỉ khái":    "trị ho, giảm ho, ho khan, ho có đờm",
    "chỉ tả":      "cầm tiêu chảy, chống tiêu chảy, kiết lỵ",
    "chỉ ẩu":      "giảm nôn, cầm nôn",
    "chỉ ngứa":    "giảm ngứa, mẩn ngứa, viêm da",
    "chỉ hãn":     "giảm đổ mồ hôi trộm, ra mồ hôi nhiều",
    "chỉ đới":     "giảm khí hư bạch đới, phụ khoa",
    "chỉ lỵ":      "trị kiết lỵ, tiêu chảy có máu",

    # ──────────────── LỢI family (drain, promote) ────────────────
    "lợi niệu":    "lợi tiểu, tiểu buốt, tiểu rắt, tiểu khó",
    "lợi tiểu":    "lợi tiểu, tiểu buốt, tiểu rắt, phù nề",
    "lợi thủy":    "lợi tiểu, giảm phù nề, giảm phù thũng",
    "lợi mật":     "thông mật, sỏi mật, vàng da",
    "lợi sữa":     "thông sữa, mẹ ít sữa, tắc sữa",
    "lợi yết":     "giảm viêm họng, đau họng, viêm yết hầu",
    "lợi gan mật": "giải độc gan, hỗ trợ gan mật, mát gan",
    "thông sữa":   "thông sữa, mẹ ít sữa, tắc tia sữa",
    "thông tiện":  "nhuận tràng, giảm táo bón",
    "nhuận tràng": "nhuận tràng, trị táo bón, đi ngoài khó",

    # ──────────────── TÁN / KHỨ / TRỪ (dispel) ────────────────
    "tán hàn":     "ấm bụng, đau bụng do lạnh, tay chân lạnh, trừ hàn",
    "ôn trung":    "làm ấm bụng, đau bụng do lạnh, tiêu hóa kém",
    "tán ứ":       "tan ứ huyết, giảm đau bụng kinh, bầm tím",
    "tán kết":     "tan u bướu, tan nhân xơ, khối u lành tính",
    "tán phong":   "trừ phong, giảm tê bì, phong thấp",
    "trừ phong":   "trừ phong thấp, giảm đau nhức xương khớp",
    "trừ thấp":    "trừ thấp, giảm phù nề, nặng chân tay",
    "khứ phong":   "trừ phong thấp, giảm đau nhức xương khớp",
    "khử ứ":       "tan ứ huyết, giảm đau do máu ứ",
    "khu phong":   "trừ phong, giảm đau nhức",

    # ──────────────── HÓA family (transform phlegm/food) ────────────────
    "hóa đàm":     "tiêu đờm, long đờm, giảm ho có đờm",
    "tiêu đờm":    "tiêu đờm, long đờm, giảm ho đờm đặc",
    "hóa thấp":    "trừ thấp, giảm nặng nề, tiêu hóa kém",
    "hóa tích":    "tiêu hóa thức ăn tích trệ, giảm đầy bụng",
    "tiêu tích":   "tiêu thực, giảm đầy bụng, ăn không tiêu",
    "tiêu thực":   "tiêu hóa thức ăn, giảm đầy bụng, ăn không tiêu",
    "tiêu độc":    "giải độc, tiêu mụn nhọt, kháng viêm",
    "tiêu viêm":   "kháng viêm, giảm viêm nhiễm, sưng đau",
    "tiêu thũng":  "giảm sưng phù, tiêu phù nề",
    "tiêu ung":    "tiêu mủ, giảm mụn nhọt, kháng viêm",
    "tiêu bỉ":     "tan khối u, tan cục, tiêu bĩ",

    # ──────────────── PHÁT / GIẢI (release exterior) ────────────────
    "phát hãn":    "giải cảm, ra mồ hôi, cảm mạo phong hàn",
    "giải biểu":   "giải cảm, cảm mạo, sốt nhẹ, đau đầu",
    "giải cơ":     "giải cảm, hạ sốt nhẹ, đau cơ",
    "giải cảm":    "trị cảm cúm, cảm mạo, hạ sốt, đau đầu",
    "ôn kinh":     "làm ấm kinh mạch, giảm đau bụng lạnh, tay chân lạnh",

    # ──────────────── KIỆN TỲ / TIÊU HÓA ────────────────
    "kiện tỳ":     "tăng cường tiêu hóa, ăn ngon miệng, đầy bụng",
    "khai vị":     "kích thích ăn uống, ăn ngon miệng",
    "hòa vị":      "giảm đau dạ dày, ợ hơi, trào ngược, viêm loét dạ dày",
    "ôn tỳ":       "làm ấm tỳ vị, đau bụng lạnh, tiêu hóa kém",

    # ──────────────── MINH MỤC / SÁNG MẮT ────────────────
    "minh mục":    "sáng mắt, cải thiện thị lực, mỏi mắt, mờ mắt",
    "sáng mắt":    "sáng mắt, cải thiện thị lực, mỏi mắt",

    # ──────────────── AN THẦN / TÂM ────────────────
    "an thần":     "an thần, giảm mất ngủ, ngủ ngon, giảm lo âu",
    "trừ phiền":   "giảm bồn chồn, giảm mất ngủ, thanh tâm",

    # ──────────────── CƯỜNG CÂN CỐT (musculoskeletal) ────────────────
    "cường cân cốt":"mạnh gân xương, giảm đau nhức xương khớp, thoái hóa",
    "mạnh gân cốt":"mạnh gân xương, giảm đau nhức xương khớp",
    "lợi gân cốt": "bổ gân xương, giảm đau khớp",
    "thư cân":     "thư giãn gân cơ, giảm co cứng cơ",
    "hoạt lạc":    "thông kinh lạc, giảm đau nhức, tê bì",

    # ──────────────── KHAI KHIẾU / THÔNG KHIẾU ────────────────
    "khai khiếu":  "thông khiếu, tỉnh táo, giảm mê man",

    # ──────────────── MIXED / clinical ────────────────
    "hỗ trợ xương khớp": "đau nhức xương khớp, thoái hóa khớp, viêm khớp",
    "kích thích tiêu hóa": "giúp tiêu hóa, ăn ngon, đầy bụng",
    "ổn định đường huyết": "tiểu đường, đường huyết cao",
    "hạ đường huyết":  "tiểu đường, hạ đường huyết",
    "hạ cholesterol":  "mỡ máu cao, giảm cholesterol",
    "hạ huyết áp":     "huyết áp cao",
    "kháng viêm":      "kháng viêm, chống viêm nhiễm, sưng đau",
    "kháng khuẩn":     "kháng khuẩn, diệt khuẩn, chống nhiễm trùng",
    "kháng u":         "hỗ trợ điều trị ung thư, kháng u bướu",

    # ──────────────── OBSTETRICS ────────────────
    "an thai":      "an thai, dưỡng thai, phòng sảy thai, động thai",

    # ──────────────── SYMPTOMS (verbatim mapping for tag-symptom bucket) ────────────────
    # These tags ARE user-facing already, but we still map so the model learns them.
    "ho":           "trị ho, giảm ho, ho khan, ho có đờm",
    "viêm họng":    "viêm họng, đau họng, rát họng, viêm amidan",
    "viêm phế quản":"viêm phế quản, viêm cuống phổi, ho đờm đặc",
    "cảm mạo":      "cảm cúm, cảm lạnh, sốt, đau đầu, sổ mũi",
    "suyễn":        "hen suyễn, khó thở, thở khò khè",
    "khàn tiếng":   "khàn tiếng, mất tiếng, đau họng nói nhiều",
    "đau đầu":      "đau đầu, nhức đầu, migraine",
    "đau nhức xương khớp": "đau nhức xương khớp, thoái hóa khớp, viêm khớp",
    "tê bàn tay chân":     "tê bì tay chân, tê tay chân, cảm giác tê",
    "đau lưng nhức mỏi":   "đau lưng, nhức mỏi lưng, thoái hóa cột sống",
    "trị ngứa":     "giảm ngứa, mẩn ngứa, viêm da",
    "trị gout":     "trị gout, giảm acid uric, đau khớp gout",
    "ung thư":      "hỗ trợ điều trị ung thư, kháng u",
}


# Reverse map for query-time expansion (lay terms → TCM terms).
# Built lazily so we don't ship a duplicate map.
_REVERSE: dict[str, list[str]] | None = None


def reverse_map() -> dict[str, list[str]]:
    """lay_term (lowercased) -> list of canonical TCM keys."""
    global _REVERSE
    if _REVERSE is None:
        from collections import defaultdict
        rev: dict[str, list[str]] = defaultdict(list)
        for tcm, lays in TCM_SYNONYMS.items():
            for lay in lays.split(","):
                lay = lay.strip().lower()
                if lay and tcm not in rev[lay]:
                    rev[lay].append(tcm)
        _REVERSE = dict(rev)
    return _REVERSE


def expand_product_text(tcm_terms: list[str], max_lays: int = 10) -> str:
    """Given a list of TCM term strings found in a product's text/tags,
    return a single user-facing phrase block.

    Returns empty string if nothing matched (caller should skip).

    Args:
        tcm_terms: list of TCM terms to expand.
        max_lays: maximum number of user-facing terms to return (default 10).
                  Capping prevents over-injection that causes cross-category noise.
    """
    if not tcm_terms:
        return ""
    seen_lays: set[str] = set()
    out: list[str] = []
    for term in tcm_terms:
        # match against canonical (lowercase, no diacritics optional)
        t = term.strip().lower()
        # direct hit
        matched = TCM_SYNONYMS.get(t)
        # try without diacritics as fallback
        if not matched:
            from data_ingestion.tag_normalizer import _canonical
            c = _canonical(term)
            for key, val in TCM_SYNONYMS.items():
                if _canonical(key) == c:
                    matched = val
                    break
        if matched:
            for lay in matched.split(","):
                lay = lay.strip().lower()
                if lay and lay not in seen_lays:
                    seen_lays.add(lay)
                    out.append(lay)
                    if len(out) >= max_lays:
                        return ", ".join(out)
    return ", ".join(out)


import re

def expand_query(query: str) -> str:
    """Given a user query, append TCM equivalents found in the reverse map.

    This bridges the user ↔ TCM vocabulary gap on the QUERY side.
    """
    rev = reverse_map()
    
    # Clean punctuation and pad query with spaces to match exact words
    clean_query = re.sub(r'[^\w\s]', ' ', query.lower())
    padded_query = f" {clean_query} "
    
    additions: list[str] = []
    seen: set[str] = set()
    for lay, tcm_list in rev.items():
        # Pad lay term with spaces
        padded_lay = f" {lay} "
        if padded_lay in padded_query:
            for tcm in tcm_list:
                # normalize TCM key for embedding
                if tcm not in seen:
                    seen.add(tcm)
                    additions.append(tcm)
    if additions:
        return query + " " + " ".join(additions)
    return query
