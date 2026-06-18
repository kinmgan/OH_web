"""Java Backend HTTP client for AI Service."""
import asyncio
import json
from pathlib import Path
from typing import Optional, Any

import httpx

from src.config import get_settings


# ── Module-level cache ──────────────────────────────────────────────────────
_CACHE_FILE = Path(__file__).parent.parent.parent / "data" / "product_detail_cache.json"


def _load_cache() -> dict[int, dict]:
    if not _CACHE_FILE.exists():
        return {}
    try:
        return json.loads(_CACHE_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _save_cache(cache: dict[int, dict]) -> None:
    _CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    _CACHE_FILE.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8"
    )


class JavaBeClient:
    """Client for communicating with the Java Spring Boot backend."""

    def __init__(self, base_url: Optional[str] = None):
        settings = get_settings()
        self.base_url = base_url or settings.java_backend_url
        self._client: Optional[httpx.AsyncClient] = None
        self._detail_cache: dict[int, dict] = _load_cache()

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=30.0,
            )
        return self._client

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None
        if self._detail_cache:
            _save_cache(self._detail_cache)
            self._detail_cache = {}

    async def get_all_products(self, page: int = 0, size: int = 100) -> dict[str, Any]:
        """Fetch products page from BE public API."""
        client = await self.get_client()
        resp = await client.get(
            "/api/v1/public/products",
            params={"page": page, "size": size},
        )
        resp.raise_for_status()
        return resp.json()

    async def get_product_detail(self, product_id: int) -> dict[str, Any]:
        """Fetch single product detail from BE API, with local cache."""
        if product_id in self._detail_cache:
            return self._detail_cache[product_id]

        client = await self.get_client()
        resp = await client.get(f"/api/v1/public/products/{product_id}")
        resp.raise_for_status()
        data = resp.json()
        self._detail_cache[product_id] = data
        return data

    async def fetch_all_products_enriched(
        self, concurrency: int = 10, skip_cache: bool = False
    ) -> list[dict]:
        """
        Adapter: fetch all products with FULL detail data.

        Strategy:
          1. List endpoint  → fast, gives id + name + whatever BE includes.
          2. Detail endpoint → per-product, gives categoryName / description /
                                sku / properties / tags / variants (for min_price).
          3. Merge: list data + detail data  → one complete dict per product.
          4. Detail calls are cached to disk so re-runs skip already-fetched IDs.

        Args:
          concurrency: max parallel detail requests (BE-friendly).
          skip_cache: force-refresh all detail records (ignores disk cache).

        Returns:
          List of complete product dicts.
        """
        if skip_cache:
            self._detail_cache = {}

        # ── Step 1: paginated list ──────────────────────────────────────
        all_products: list[dict] = []
        page = 0
        page_size = 100
        while True:
            data = await self.get_all_products(page=page, size=page_size)
            content = data.get("content", [])
            if not content:
                break
            for item in content:
                item["_source"] = "list"
            all_products.extend(content)
            if data.get("last", False) or data.get("totalPages", 1) <= page + 1:
                break
            page += 1

        # ── Step 2: fetch detail for products missing key fields ───────
        needs_detail = [
            p for p in all_products
            if not p.get("categoryName") and p["id"] not in self._detail_cache
        ]

        if needs_detail:
            ids = [p["id"] for p in needs_detail]
            semaphore = asyncio.Semaphore(concurrency)

            async def fetch_one(pid: int) -> None:
                async with semaphore:
                    try:
                        await self.get_product_detail(pid)
                    except Exception:
                        pass  # non-fatal; list data still usable

            await asyncio.gather(*(fetch_one(pid) for pid in ids))

        # ── Step 3: merge list + cache ─────────────────────────────────
        result: list[dict] = []
        for p in all_products:
            cached = self._detail_cache.get(p["id"], {})
            merged = {**p, **cached}  # detail fields override list fields
            result.append(merged)

        return result

    def build_product_text(self, product: dict) -> str:
        """Build searchable text from product data (detail endpoint fields)."""
        name = product.get("name", "")
        description = product.get("description", "") or ""
        sku = product.get("sku", "") or ""

        category_name = product.get("categoryName", "") or ""
        if not category_name:
            cat = product.get("category")
            if cat:
                category_name = cat.get("name", "") if isinstance(cat, dict) else str(cat)

        tags = product.get("tags") or []
        tags_str = ", ".join(tags) if isinstance(tags, list) else ""

        properties = product.get("properties") or []
        props_str = ", ".join(properties) if isinstance(properties, list) else ""

        price = product.get("price")
        if not price:
            variants = product.get("variants") or []
            if variants:
                prices = [v.get("price", 0) or 0 for v in variants if v.get("price")]
                if prices:
                    price = min(prices)

        lines = [f"Tên sản phẩm: {name}"]
        if sku:
            lines.append(f"Mã SKU: {sku}")
        if category_name:
            lines.append(f"Danh mục: {category_name}")
        if description:
            lines.append(f"Mô tả: {description}")
        if props_str:
            lines.append(f"Tính chất thảo dược: {props_str}")
        if tags_str:
            lines.append(f"Tags: {tags_str}")
        if price:
            lines.append(f"Giá từ: {price}")

        return "\n".join(lines)
