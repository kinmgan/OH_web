"""Product ingestion — fetch from BE DB and produce product vectors."""
import asyncio
from dataclasses import dataclass

from data_ingestion.tag_normalizer import normalize_tags
from data_ingestion.tcm_synonyms import expand_product_text, TCM_SYNONYMS


@dataclass
class ProductDoc:
    """A product document ready for embedding."""
    product_id: int
    name: str
    text: str
    category: str
    min_price: str

    def to_payload(self) -> dict:
        return {
            "product_id": self.product_id,
            "name": self.name,
            "category": self.category,
            "min_price": self.min_price,
        }


async def fetch_all_products() -> list[ProductDoc]:
    """Fetch all products with full detail data from the Java backend.

    Uses JavaBeClient.fetch_all_products_enriched() which:
      1. Calls the list endpoint (fast, paginated).
      2. Calls the detail endpoint for any product missing key fields
         (parallel, with disk cache to avoid re-fetching).
      3. Merges both into one complete record per product.
    """
    from src.services.java_be_client import JavaBeClient

    client = JavaBeClient()
    try:
        products = await client.fetch_all_products_enriched(concurrency=10)
    finally:
        await client.close()
    return build_product_docs(products)


def build_product_docs(products: list[dict]) -> list[ProductDoc]:
    """Convert raw product dicts into ProductDoc objects.

    Handles both list-only payload (from /products) and full detail payload
    (from /products/{id}). Field names from the detail endpoint:
      - categoryName: str
      - variants: list[dict]  with fields 'price', 'originalPrice', 'finalPrice' ...
    """
    docs: list[ProductDoc] = []
    for p in products:
        # categoryName comes from detail; list endpoint has no category field
        category = p.get("categoryName", "") or ""

        # min_price: prefer list endpoint's price, else lowest variant price
        min_price: str = ""
        if p.get("price"):
            min_price = str(p["price"])
        else:
            variants = p.get("variants") or []
            if variants:
                prices = [v.get("price", 0) or 0 for v in variants]
                if prices:
                    min_price = str(min(prices))

        text = _build_text(p)
        docs.append(ProductDoc(
            product_id=p.get("id", 0),
            name=p.get("name", ""),
            text=text,
            category=category,
            min_price=min_price,
        ))
    return docs


def _build_text(product: dict) -> str:
    """Build the searchable text block for a product.

    Layout (in order):
      1. Tên sản phẩm (lặp 2 lần để tăng weight trong embedding)
      2. Danh mục (giúp hard-match category)
      3. SKU (nếu có)
      4. Tác dụng Đông y (từ tag actions, đã chuẩn hóa + dedup)
      5. Triệu chứng TCM (từ tag symptoms, đã chuẩn hóa)
      6. Mô tả chi tiết (description gốc, đã strip HTML)
      7. Từ khóa người dùng hay tìm (injected từ TCM_SYNONYMS — QUAN TRỌNG)

    The "user keywords" block (7) bridges the vocabulary gap between
    TCM terminology in the DB and lay-language search queries.
    """
    name = product.get("name", "") or ""
    category = product.get("categoryName", "") or ""
    if not category:
        cat = product.get("category")
        if cat:
            category = cat.get("name", "") if isinstance(cat, dict) else str(cat)

    lines: list[str] = []

    # Block 1: name (nhấn mạnh bằng cách lặp 2 lần + label rõ ràng)
    if name:
        lines.append(f"Tên sản phẩm: {name}")
        lines.append(f"Tên gọi: {name}")

    # Block 2: category
    if category:
        lines.append(f"Danh mục: {category}")

    # Block 3: SKU
    sku = product.get("sku")
    if sku:
        lines.append(f"Mã SKU: {sku}")

    # Block 4 & 5: tags, classified
    raw_tags = product.get("tags") or []
    groups = normalize_tags(raw_tags)
    if groups.tcm_actions:
        lines.append("Tác dụng Đông y: " + ", ".join(groups.tcm_actions))
    if groups.symptoms:
        lines.append("Triệu chứng thường dùng: " + ", ".join(groups.symptoms))
    if groups.category_like:
        lines.append("Nhóm: " + ", ".join(groups.category_like))
    # Block meta thường không có giá trị retrieval → bỏ qua để tránh noise

    # Block 6: description (original)
    description = product.get("description") or ""
    if description:
        clean = description.replace("<p>", "").replace("</p>", " ").replace("<br>", "\n")
        clean = clean.strip()
        if clean:
            lines.append(f"Mô tả chi tiết: {clean}")

    # Block 7: USER-FACING KEYWORDS (từ TCM_SYNONYMS)
    # Collect all TCM terms seen in this product (tags + description text)
    tcm_terms: list[str] = list(groups.tcm_actions)
    if description:
        # also scan description for TCM terms (each tag's value is a TCM action)
        desc_lower = description.lower()
        for tcm in TCM_SYNONYMS:
            if tcm in desc_lower:
                tcm_terms.append(tcm)
    user_keywords = expand_product_text(tcm_terms)
    if user_keywords:
        lines.append(f"Phù hợp với người tìm: {user_keywords}")

    # Block 8: price (giữ nguyên như cũ)
    price = product.get("price")
    if not price:
        variants = product.get("variants") or []
        if variants:
            prices = [v.get("price", 0) or 0 for v in variants if v.get("price")]
            if prices:
                price = min(prices)
    if price:
        lines.append(f"Giá từ: {price}")

    return "\n".join(lines)
