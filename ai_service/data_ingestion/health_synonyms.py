"""Health-domain synonym map for query-side expansion.

Bridges the gap between how users search (short, colloquial Vietnamese)
and how medical articles phrase their titles/sections (full formal names).

Format: key = lay term (lowercase) → value = comma-separated formal equivalents.
Every key on the LEFT is what a user might type.
Every value on the RIGHT is the phrasing used in article titles/sections.
"""

# Canonical lay term → formal medical equivalents.
# Entries are ordered by frequency in real user queries.
HEALTH_SYNONYMS: dict[str, str] = {

    # ── Xương khớp ──────────────────────────────────────────────────────────
    "đau vai gáy":      "đau vai gáy, đau cổ vai, đau cổ vai gáy, hội chứng cổ vai cánh tay, đau cơ cổ",
    "đau cổ vai":       "đau vai gáy, đau cổ vai, đau cổ vai gáy",
    "đau cổ":           "đau cổ, đau cổ vai, đau cổ vai gáy",
    "đau vai":          "đau vai, đau vai gáy, đau cổ vai",
    "thoái hóa cột sống cổ": "thoái hóa đốt sống cổ, thoái hóa cột sống cổ, bệnh thoái hóa cột sống cổ",
    "thoái hóa đốt sống cổ": "thoái hóa đốt sống cổ, thoái hóa cột sống cổ",
    "thoái hóa cổ":    "thoái hóa đốt sống cổ, thoái hóa cột sống cổ",
    "thoái hóa khớp gối": "thoái hóa khớp gối, thoái hóa đầu gối, bệnh thoái hóa khớp gối",
    "thoái hóa gối":   "thoái hóa khớp gối, thoái hóa đầu gối",
    "thoái hóa khớp":  "thoái hóa khớp, thoái hóa xương khớp, bệnh thoái hóa khớp",
    "thoát vị đĩa đệm": "thoát vị đĩa đệm, thoát vị đĩa đệm cột sống, thoát vị đĩa đệm cổ, thoát vị đĩa đệm thắt lưng",
    "thoát vị đĩa đệm cổ": "thoát vị đĩa đệm cổ, thoát vị đĩa đệm cột sống cổ",
    "thoát vị đĩa đệm thắt lưng": "thoát vị đĩa đệm thắt lưng, thoát vị đĩa đệm lưng, thoát vị đĩa đệm l5 s1",
    "thoát vị đĩa đệm lưng": "thoát vị đĩa đệm thắt lưng, thoát vị đĩa đệm lưng",
    "lồi đĩa đệm":     "lồi đĩa đệm, phình đĩa đệm, thoát vị đĩa đệm",
    "phình đĩa đệm":    "phình đĩa đệm, lồi đĩa đệm, thoát vị đĩa đệm",
    "đau thắt lưng":    "đau thắt lưng, đau lưng dưới, đau lưng kinh niên, đau lưng giãn dây chằng",
    "đau lưng":         "đau lưng, đau thắt lưng, đau lưng dưới, đau lưng giãn dây chằng",
    "đau nhức xương khớp": "đau nhức xương khớp, đau xương khớp, nhức xương khớp, thoái hóa xương khớp",
    "nhức xương khớp":  "đau nhức xương khớp, đau xương khớp, nhức xương khớp",
    "viêm khớp":        "viêm khớp, viêm khớp dạng thấp, viêm đa khớp dạng thấp",
    "viêm khớp dạng thấp": "viêm khớp dạng thấp, viêm đa khớp dạng thấp, thấp khớp",
    "viêm đa khớp":     "viêm khớp dạng thấp, viêm đa khớp dạng thấp",
    "gai cột sống":     "gai cột sống, gai đốt sống, thoái hóa cột sống có gai",
    "gai đốt sống":     "gai cột sống, gai đốt sống",
    "đau dây thần kinh liên sườn": "đau dây thần kinh liên sườn, đau thần kinh liên sườn, đau dây thần kinh giữa các khe sườn",
    "đau dây thần kinh": "đau dây thần kinh, đau dây thần kinh liên sườn, tổn thương dây thần kinh",
    "thần kinh liên sườn": "đau dây thần kinh liên sườn, đau thần kinh liên sườn",

    # ── Thần kinh / não ────────────────────────────────────────────────────
    "mất ngủ":          "mất ngủ, mất ngủ kinh niên, mất ngủ mãn tính, rối loạn giấc ngủ, insomnia",
    "mất ngủ kinh niên": "mất ngủ kinh niên, mất ngủ mãn tính, rối loạn giấc ngủ",
    "suy nhược thần kinh": "suy nhược thần kinh, suy nhược thần kinh mạn tính, kiệt sức thần kinh",
    "rối loạn tiền đình": "rối loạn tiền đình, rối loạn thần kinh tiền đình, chóng mặt tiền đình, bệnh tiền đình",
    "chóng mặt":         "chóng mặt, chóng mặt kịch phát, chóng mặt tư thế, rối loạn tiền đình",
    "rối loạn thần kinh thực vật": "rối loạn thần kinh thực vật, rối loạn thần kinh tự chủ",
    "liệt dây thần kinh số 7": "liệt dây thần kinh số 7, liệt mặt, liệt dây thần kinh vận nhãn, liệt dây thần kinh ngoại biên",
    "liệt mặt":          "liệt dây thần kinh số 7, liệt mặt trung ương, liệt mặt ngoại biên",
    "tai biến mạch máu não": "tai biến mạch máu não, tai biến mạch máu não, đột quỵ, tai biến não, xơ vữa mạch máu não",
    "tai biến":           "tai biến mạch máu não, tai biến méo miệng, tai biến tiêm tĩnh mạch, đột quỵ",

    # ── Tim mạch / huyết áp ───────────────────────────────────────────────
    "huyết áp cao":      "huyết áp cao, tăng huyết áp, bệnh cao huyết áp, tăng huyết áp",
    "cao huyết áp":       "huyết áp cao, tăng huyết áp, bệnh cao huyết áp",
    "tăng huyết áp":      "huyết áp cao, tăng huyết áp, bệnh cao huyết áp",
    "huyết áp thấp":      "huyết áp thấp, hạ huyết áp, bệnh huyết áp thấp",
    "hạ huyết áp":        "huyết áp thấp, hạ huyết áp",
    "xơ vữa động mạch":  "xơ vữa động mạch, xơ vữa mạch máu, xơ vữa động mạch vành, xơ vữa động mạch chi dưới, xơ vữa động mạch cảnh",
    "xơ vữa mạch máu":    "xơ vữa mạch máu, xơ vữa động mạch, xơ vữa mạch máu não",
}

# ── Vietnamese diacritics normalization ─────────────────────────────────────

_DIACRITICS_MAP: dict[str, str] = {
    "à": "a", "á": "a", "ả": "a", "ã": "a", "ạ": "a",
    "ă": "a", "ằ": "a", "ắ": "a", "ẳ": "a", "ẵ": "a", "ặ": "a",
    "â": "a", "ầ": "a", "ấ": "a", "ẩ": "a", "ẫ": "a", "ậ": "a",
    "è": "e", "é": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e",
    "ê": "e", "ề": "e", "ế": "e", "ể": "e", "ễ": "e", "ệ": "e",
    "ì": "i", "í": "i", "ỉ": "i", "ĩ": "i", "ị": "i",
    "ò": "o", "ó": "o", "ỏ": "o", "õ": "o", "ọ": "o",
    "ô": "o", "ồ": "o", "ố": "o", "ổ": "o", "ỗ": "o", "ộ": "o",
    "ơ": "o", "ờ": "o", "ớ": "o", "ở": "o", "ỡ": "o", "ợ": "o",
    "ù": "u", "ú": "u", "ủ": "u", "ũ": "u", "ụ": "u",
    "ư": "u", "ừ": "u", "ứ": "u", "ử": "u", "ữ": "u", "ự": "u",
    "ỳ": "y", "ý": "y", "ỷ": "y", "ỹ": "y", "ỵ": "y",
    "đ": "d",
}


def _canonical(text: str) -> str:
    """Strip Vietnamese diacritics for comparison."""
    return "".join(_DIACRITICS_MAP.get(c, c) for c in text.lower())


# Reverse map for query expansion (built lazily).
_HEALTH_REVERSE: dict[str, list[str]] | None = None


def get_health_reverse_map() -> dict[str, list[str]]:
    """lay_term → list of formal medical keys found in that entry's value."""
    global _HEALTH_REVERSE
    if _HEALTH_REVERSE is None:
        from collections import defaultdict
        rev: dict[str, list[str]] = defaultdict(list)
        for key, vals in HEALTH_SYNONYMS.items():
            for val in vals.split(","):
                val = val.strip().lower()
                if val and key not in rev[val]:
                    rev[val].append(key)
        _HEALTH_REVERSE = dict(rev)
    return _HEALTH_REVERSE


def expand_health_query(query: str) -> str:
    """Given a user health query, append formal equivalents found in the synonym map.

    Strategy: if user types a lay term, add the formal medical terms.
    If user types a formal term, add the lay aliases (bidirectional).
    Handles queries with or without diacritics (Vietnamese tone marks).
    """
    rev = get_health_reverse_map()
    query_canonical = _canonical(query)
    additions: list[str] = []
    seen: set[str] = set()

    # Forward: lay term → formal equivalents
    for lay, formals in HEALTH_SYNONYMS.items():
        lay_canonical = _canonical(lay)
        if lay_canonical in query_canonical:
            for f in formals.split(","):
                f = f.strip()
                if f and f not in seen:
                    seen.add(f)
                    additions.append(f)

    # Bidirectional: formal term → lay aliases
    for formal, aliases in rev.items():
        if formal in query_canonical:
            for alias in aliases:
                alias_canonical = _canonical(alias)
                if alias_canonical not in query_canonical and alias not in seen:
                    seen.add(alias)
                    additions.append(alias)

    if additions:
        return query + " " + " ".join(additions)
    return query
