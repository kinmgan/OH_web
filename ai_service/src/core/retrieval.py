"""Retrieval strategies cho 3 luồng (Health/Shopping/Chitchat).

Chiến lược (mục 3.2 plan):
  - Shopping: vector search top 20 + Qdrant filter (total_stock > 0,
    min_price <= budget, category_id IN [...]) → trả top 5.
  - Health: vector search top 10 (không filter) → lấy top 3 theo score.
  - Chitchat: không retrieval → trả [].
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from qdrant_client import models

from src.services.embedding_client import EmbeddingClient
from src.services.qdrant_client import QdrantService
from src.config import get_settings
from data_ingestion.health_synonyms import expand_health_query
from data_ingestion.tcm_synonyms import expand_query
from src.core.rerank import rerank_health_hits, rerank_product_hits

logger = logging.getLogger(__name__)


# ── Result schemas ────────────────────────────────────────────────────────
@dataclass
class HealthHit:
    """Một chunk y khoa match."""
    score: float
    article_title: str
    section_title: str
    content: str
    source: str
    section: str
    url: str
    chunk_index: int
    total_chunks: int

    def to_citation(self) -> dict:
        return {
            "title": self.article_title,
            "section": self.section_title,
            "url": self.url,
            "source": self.source,
            "score": round(self.score, 4),
        }


@dataclass
class ProductHit:
    """Một sản phẩm match."""
    score: float
    product_id: int
    name: str
    description: str
    min_price: float
    category_name: str
    category_id: Optional[int]
    total_stock: int
    average_rating: Optional[float]
    sold_quantity: int
    tags: list[str]
    sku: str

    def to_dict(self) -> dict:
        return {
            "product_id": self.product_id,
            "name": self.name,
            "description": self.description,
            "min_price": self.min_price,
            "category_name": self.category_name,
            "category_id": self.category_id,
            "total_stock": self.total_stock,
            "average_rating": self.average_rating,
            "sold_quantity": self.sold_quantity,
            "tags": self.tags,
            "sku": self.sku,
        }


@dataclass
class RetrievalResult:
    """Kết quả retrieval gộp."""
    intent: str
    health_hits: list[HealthHit] = field(default_factory=list)
    product_hits: list[ProductHit] = field(default_factory=list)
    debug_info: dict = field(default_factory=dict)

    def to_citations(self) -> list[dict]:
        return [h.to_citation() for h in self.health_hits]

    def to_products(self) -> list[dict]:
        return [p.to_dict() for p in self.product_hits]


# ── Budget & category extraction (mục 2.2 plan) ───────────────────────────
# Match cả keyword có dấu và không dấu (vd: "dưới" hoặc "duoi").
_BUDGET_PATTERN = re.compile(
    r"(?:d[uướ][oớ]i|<|<=|kh[oô]ng\s+qu[aá]|t[oố]i\s+[dđ]a|max|t[aầ]m|kho[aả]ng)\s*"
    r"(\d+(?:[\.,]\d+)?)\s*(k|ngh[iì]n|ng[aà]n|tr(?:i[eệ]u)?|[dđ][oồ]ng|vnd|[dđ])?",
    re.IGNORECASE,
)
_NUM_UNIT_TO_VND = {
    "k": 1_000,
    "nghin": 1_000,
    "nghìn": 1_000,
    "ngan": 1_000,
    "ngàn": 1_000,
    "tr": 1_000_000,
    "trieu": 1_000_000,
    "triệu": 1_000_000,
    "dong": 1,
    "đồng": 1,
    "vnd": 1,
    "d": 1,
    "đ": 1,
}


def extract_budget(query: str) -> Optional[float]:
    """Trích xuất budget max từ query.

    Hỗ trợ cả có dấu và không dấu:
      "dưới 500k" / "duoi 500k" → 500000
      "khoảng 1 triệu" / "khoang 1 trieu" → 1000000
      "tầm 300 nghìn" / "tam 300 nghin" → 300000
      "dưới 700k đồng" / "duoi 700k dong" → 700000
    Returns None nếu không match.
    """
    m = _BUDGET_PATTERN.search(query)
    if not m:
        return None
    try:
        number = float(m.group(1).replace(",", "."))
    except (ValueError, AttributeError):
        return None
    unit_raw = (m.group(2) or "dong").lower().strip()
    unit = _NUM_UNIT_TO_VND.get(unit_raw, 1)
    budget = number * unit
    return budget if budget > 0 else None


# ── Category keyword map (đơn giản) ───────────────────────────────────────
_CATEGORY_KEYWORD_FILE = Path(__file__).parent.parent / "data" / "category_map.json"


def load_category_map() -> dict[str, list[str]]:
    """Load map keyword → [category_id, category_name]. Tạo default nếu chưa có."""
    if not _CATEGORY_KEYWORD_FILE.exists():
        # Tạo file default — sẽ được update khi biết thêm category từ BE
        default = {
            "xương khớp": [],
            "bổ não": [],
            "tim mạch": [],
            "tiểu đường": [],
            "huyết áp": [],
            "mất ngủ": [],
            "gan": [],
            "thận": [],
            "dạ dày": [],
            "đường hô hấp": [],
            "làm đẹp": [],
            "giảm cân": [],
        }
        _CATEGORY_KEYWORD_FILE.parent.mkdir(parents=True, exist_ok=True)
        import json
        _CATEGORY_KEYWORD_FILE.write_text(
            json.dumps(default, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return default
    import json
    return json.loads(_CATEGORY_KEYWORD_FILE.read_text(encoding="utf-8"))


def match_category_ids(query: str, category_map: dict[str, list[str]]) -> list[int]:
    """Tìm category_id match keyword trong query.

    Lưu ý: category_id list sẽ rỗng nếu chưa populate từ BE.
    Logic này sẽ được update trong bước 6 sau khi biết category IDs thật.
    Hiện tại chỉ match keyword và trả về list id (có thể rỗng).
    """
    q = query.lower()
    matched_ids: set[int] = set()
    for keyword, ids in category_map.items():
        if keyword in q and ids:
            matched_ids.update(ids)
    return list(matched_ids)


# ── Retriever chính ───────────────────────────────────────────────────────
class Retriever:
    """Multi-strategy retriever cho 3 luồng."""

    HEALTH_TOP_K_VECTORS = 20   # fetch more for reranker to pick best
    HEALTH_TOP_K_FINAL = 3
    SHOPPING_TOP_K_VECTORS = 30  # fetch more for reranker
    SHOPPING_TOP_K_FINAL = 5
    HEALTH_SCORE_THRESHOLD = 0.20  # lower threshold now that rerank helps

    def __init__(
        self,
        embedding_client: Optional[EmbeddingClient] = None,
        qdrant_service: Optional[QdrantService] = None,
    ):
        settings = get_settings()
        self.embedding = embedding_client or EmbeddingClient()
        self.qdrant = qdrant_service or QdrantService()
        self.collection_articles = settings.collection_articles
        self.collection_products = settings.collection_products
        self.category_map = load_category_map()

    def health_search(self, query: str) -> list[HealthHit]:
        """Vector search top 20 → hybrid rerank → lấy top 3.

        Query expansion: lay terms → formal medical equivalents (bidirectional).
        Hybrid rerank: vector + BM25-lite + section title match.
        """
        expanded = expand_health_query(query)
        if expanded != query:
            logger.info("Query expanded: %s → %s", query, expanded)
        try:
            query_vec = self.embedding.embed_text(expanded)
        except Exception as exc:
            logger.error("Embedding failed in health_search: %s", exc)
            return []

        try:
            raw_hits = self.qdrant.search(
                collection_name=self.collection_articles,
                query_vector=query_vec,
                limit=self.HEALTH_TOP_K_VECTORS,
            )
        except Exception as exc:
            logger.error("Qdrant search failed in health_search: %s", exc)
            return []

        if not raw_hits:
            return []

        # Hybrid reranking: vector + BM25-lite + section title match
        reranked = rerank_health_hits(expanded, raw_hits)

        hits: list[HealthHit] = []
        for scored in reranked:
            payload = scored.payload
            hits.append(
                HealthHit(
                    score=scored.combined_score,
                    article_title=payload.get("article_title", ""),
                    section_title=payload.get("section_title", ""),
                    content=payload.get("content", ""),
                    source=payload.get("source", ""),
                    section=payload.get("section", ""),
                    url=payload.get("url", ""),
                    chunk_index=payload.get("chunk_index", 0),
                    total_chunks=payload.get("total_chunks", 1),
                )
            )

        # Filter and return top-N
        filtered = [h for h in hits if h.score >= self.HEALTH_SCORE_THRESHOLD]
        return filtered[: self.HEALTH_TOP_K_FINAL]

    def shopping_search(
        self,
        query: str,
        budget: Optional[float] = None,
        category_ids: Optional[list[int]] = None,
    ) -> list[ProductHit]:
        """Vector search top 20 + filter → trả top 5.

        Filter logic:
          - `min_price` được lưu trong payload dưới dạng STRING (xem
            `product_ingestion.ProductDoc.min_price`). Qdrant Range trên string
            không hoạt động đáng tin cậy, nên ta:
              1. Lấy top 20 vector hits (không filter tại Qdrant).
              2. Filter Python-side theo `min_price <= budget` và
                 `category_id IN [...]` (nếu có).
              3. Trả top 5 sau filter.
        Note: Khi schema sản phẩm được enrich thêm (total_stock, category_id
        dạng int, average_rating...) thì filter sẽ chuyển sang Qdrant-side.
        """
        try:
            query_vec = self.embedding.embed_text(query)
        except Exception as exc:
            logger.error("Embedding failed in shopping_search: %s", exc)
            return []

        try:
            raw_hits = self.qdrant.search(
                collection_name=self.collection_products,
                query_vector=query_vec,
                limit=self.SHOPPING_TOP_K_VECTORS,
            )
        except Exception as exc:
            logger.error("Qdrant search failed in shopping_search: %s", exc)
            return []

        hits: list[ProductHit] = []
        for raw in raw_hits:
            payload = raw.get("payload", {})
            score = raw.get("score", 0.0)
            try:
                min_price = float(payload.get("min_price", 0) or 0)
            except (ValueError, TypeError):
                min_price = 0.0

            hits.append(
                ProductHit(
                    score=score,
                    product_id=int(payload.get("product_id", 0)),
                    name=payload.get("name", ""),
                    description=payload.get("description", "") or "",
                    min_price=min_price,
                    category_name=payload.get("category", "") or payload.get("category_name", ""),
                    category_id=payload.get("category_id"),
                    total_stock=int(payload.get("total_stock", 0) or 0),
                    average_rating=payload.get("average_rating") or payload.get("averageRating"),
                    sold_quantity=int(payload.get("sold_quantity", 0) or payload.get("soldQuantity", 0) or 0),
                    tags=payload.get("tags", []) or [],
                    sku=payload.get("sku", "") or "",
                )
            )

        # Python-side filter (an toàn với string payload)
        filtered = hits
        if budget is not None:
            filtered = [h for h in filtered if h.min_price <= budget]
        if category_ids:
            id_set = set(category_ids)
            filtered = [h for h in filtered if h.category_id in id_set]

        # Hybrid reranking: vector + BM25-lite + name match
        raw_for_rerank = [
            {"score": h.score, "payload": {
                "name": h.name,
                "description": h.description,
                "category_name": h.category_name,
                "tags": h.tags,
                "product_id": h.product_id,
            }}
            for h in filtered
        ]
        reranked = rerank_product_hits(query, raw_for_rerank)

        # Reconstruct ProductHit from reranked
        product_map = {h.product_id: h for h in filtered}
        reranked_hits = []
        for scored in reranked:
            pid = scored.payload.get("product_id")
            if pid in product_map:
                ph = product_map[pid]
                ph.score = scored.combined_score
                reranked_hits.append(ph)

        return reranked_hits[: self.SHOPPING_TOP_K_FINAL] 

    def retrieve(
        self,
        intent: str,
        query: str,
    ) -> RetrievalResult:
        """Dispatch retrieval theo intent."""
        if intent == "health":
            hits = self.health_search(query)
            return RetrievalResult(
                intent="health",
                health_hits=hits,
                debug_info={"top_k": self.HEALTH_TOP_K_FINAL},
            )
        elif intent == "shopping":
            budget = extract_budget(query)
            category_ids = match_category_ids(query, self.category_map)
            hits = self.shopping_search(query, budget=budget, category_ids=category_ids)
            return RetrievalResult(
                intent="shopping",
                product_hits=hits,
                debug_info={
                    "budget": budget,
                    "category_ids": category_ids,
                    "top_k": self.SHOPPING_TOP_K_FINAL,
                },
            )
        else:  # chitchat
            return RetrievalResult(intent="chitchat", debug_info={"skip_retrieval": True})


# Singleton
_retriever_instance: Optional[Retriever] = None


def get_retriever() -> Retriever:
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = Retriever()
    return _retriever_instance
