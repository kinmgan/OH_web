"""Hybrid reranking — combines vector similarity + BM25-lite keyword overlap + title match boost.

Applies to both Health and Product retrieval. Each domain has its own weights.

Pipeline:
  1. Vector search (Qdrant) → top-K raw hits with cosine scores
  2. For each hit, compute:
       - keyword_score: Jaccard-like overlap between query words and chunk words
       - title_boost: exact/partial match bonus between query and section/product title
  3. Combine scores: final = (vector_weight * vector_score) + (keyword_weight * keyword_score) + (title_weight * title_match_score)
  4. Re-sort by final score
"""
from __future__ import annotations

import re
import math
from dataclasses import dataclass
from typing import Protocol

# ── Tokenizer ────────────────────────────────────────────────────────────────

# Vietnamese tokenization: split on whitespace + strip punctuation
_VN_PUNCT_RE = re.compile(r"^[^\wÀ-ỹ]+|[^\wÀ-ỹ]+$")

_VN_STOPWORDS = {
    "là", "có", "và", "của", "các", "những", "bị", "cho", "với", "được",
    "như", "một", "rất", "nhiều", "ở", "trong", "để", "không", "thì", "mà",
    "khi", "người", "vào", "ra", "đến", "từ", "lại", "này", "còn", "về",
    "đã", "sẽ", "đang", "nên", "phải", "hay", "cũng", "sự", "do", "bởi"
}


def _tokenize(text: str) -> set[str]:
    """Return a set of lowercase tokens from text, stripped of Vietnamese punctuation and stopwords."""
    if not text:
        return set()
    tokens: set[str] = set()
    for word in text.lower().split():
        word = _VN_PUNCT_RE.sub("", word)
        if word and word not in _VN_STOPWORDS:
            tokens.add(word)
    return tokens


def _tokenize_list(text: str) -> list[str]:
    """Return a list of lowercase tokens (preserving order)."""
    if not text:
        return []
    tokens: list[str] = []
    for word in text.lower().split():
        word = _VN_PUNCT_RE.sub("", word)
        if word:
            tokens.append(word)
    return tokens


# ── BM25-Lite scoring ────────────────────────────────────────────────────────

def _bm25_lite_score(query: str, document: str) -> float:
    """Compute a BM25-inspired keyword overlap score between query and document.

    Uses a simplified approach without inverted index:
      - Tokenize both query and document
      - Compute Jaccard similarity: |query_tokens ∩ doc_tokens| / |query_tokens|
      - Scale by log smoothing: 1 + log(1 + match_count)

    This captures exact keyword matches without needing a full BM25 inverted index.
    """
    q_tokens = _tokenize(query)
    d_tokens = _tokenize(document)

    if not q_tokens:
        return 0.0

    intersection = q_tokens & d_tokens
    if not intersection:
        return 0.0

    # Slightly smoothed: reward more matches but with diminishing returns
    match_count = len(intersection)
    jaccard = match_count / len(q_tokens)

    # BM25-lite: k=1.2 is standard BM25 k parameter
    k = 1.2
    doc_len = len(d_tokens)
    avg_doc_len = max(doc_len, 1)  # avoid div by zero
    bm25_term = match_count * (k + 1) / (match_count + k * (1 - 0.75 + 0.75 * doc_len / avg_doc_len))

    # Combine Jaccard + BM25-lite for robustness
    return 0.4 * jaccard + 0.6 * bm25_term


# ── Section/Title Match Boost ───────────────────────────────────────────────

def _title_match_score(query: str, title: str) -> float:
    """Compute how well query matches a section/product title.

    Returns:
      1.0  — no match
      1.3  — partial match (query token appears in title)
      1.6  — strong match (query substring in title)
      2.0  — exact or near-exact match
    """
    if not query or not title:
        return 1.0

    q = query.lower().strip()
    t = title.lower().strip()

    # Exact match
    if q == t:
        return 2.0

    # Query is a substring of title
    if q in t:
        return 1.6

    # Reverse: title is a substring of query
    if t in q:
        return 1.6

    # Token-level check: all query tokens appear in title
    q_tokens = set(q.split())
    t_tokens = set(t.split())
    if q_tokens and q_tokens.issubset(t_tokens):
        return 1.5

    # Partial token match
    overlap = q_tokens & t_tokens
    if q_tokens and overlap:
        ratio = len(overlap) / len(q_tokens)
        if ratio >= 0.6:
            return 1.3
        if ratio >= 0.3:
            return 1.15

    return 1.0


# ── Domain weights ───────────────────────────────────────────────────────────

@dataclass(frozen=True)
class RerankWeights:
    """Weights for the three score components in hybrid reranking."""
    vector: float = 0.65   # cosine similarity from Qdrant
    keyword: float = 0.20   # BM25-lite keyword overlap
    title_boost: float = 0.15  # section/product title match


# Default weights per domain
HEALTH_WEIGHTS = RerankWeights(vector=0.65, keyword=0.20, title_boost=0.15)
PRODUCT_WEIGHTS = RerankWeights(vector=0.60, keyword=0.25, title_boost=0.15)


# ── Core reranking ────────────────────────────────────────────────────────────

@dataclass
class ScoredHit:
    """A hit with combined score breakdown."""
    original_score: float
    combined_score: float
    vector_score: float
    keyword_score: float
    title_score: float
    payload: dict


def rerank_hits(
    query: str,
    hits: list[dict],
    weights: RerankWeights,
    content_key: str,
    title_key: str,
) -> list[ScoredHit]:
    """Rerank a list of Qdrant hits using hybrid scoring.

    Args:
        query: original user query
        hits: list of Qdrant hit dicts with 'score' and 'payload'
        weights: domain-specific weight configuration
        content_key: payload key for the text to score (e.g. 'content' for health, 'name' for product)
        title_key: payload key for the title (e.g. 'section_title' for health, 'name' for product)

    Returns:
        hits sorted by combined_score descending, each enriched with score breakdown
    """
    if not hits:
        return []

    scored: list[ScoredHit] = []
    for hit in hits:
        payload = hit.get("payload", {})
        vector_score = float(hit.get("score", 0.0))

        content = payload.get(content_key, "")
        title = payload.get(title_key, "")

        keyword_score = _bm25_lite_score(query, content)
        title_score = _title_match_score(query, title)

        combined = (
            weights.vector * vector_score
            + weights.keyword * keyword_score
            + weights.title_boost * title_score
        )

        scored.append(ScoredHit(
            original_score=vector_score,
            combined_score=combined,
            vector_score=vector_score,
            keyword_score=keyword_score,
            title_score=title_score,
            payload=payload,
        ))

    scored.sort(key=lambda x: x.combined_score, reverse=True)
    return scored


# ── Health-specific reranking ────────────────────────────────────────────────

def rerank_health_hits(query: str, hits: list[dict]) -> list[ScoredHit]:
    """Rerank health article hits with health-specific weights."""
    return rerank_hits(
        query=query,
        hits=hits,
        weights=HEALTH_WEIGHTS,
        content_key="content",
        title_key="section_title",
    )


# ── Product-specific reranking ───────────────────────────────────────────────

def rerank_product_hits(query: str, hits: list[dict]) -> list[ScoredHit]:
    """Rerank product hits with product-specific weights."""
    return rerank_hits(
        query=query,
        hits=hits,
        weights=PRODUCT_WEIGHTS,
        content_key="description",
        title_key="name",
    )
