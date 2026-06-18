"""Seed products (from BE DB) into Qdrant health_products collection."""
import sys
import asyncio
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import get_settings
from src.services.qdrant_client import QdrantService
from src.services.embedding_client import EmbeddingClient
from data_ingestion.product_ingestion import fetch_all_products


EMBED_BATCH_SIZE = 256
UPSERT_BATCH_SIZE = 100
MAX_RETRIES = 3
RETRY_BASE_DELAY = 5


def _sanitize_id(raw: str) -> str:
    """Qdrant IDs cannot contain backslash or control chars."""
    return raw.replace("\\", "/").replace("\n", "_").replace("\r", "_")


def embed_batch_with_retry(
    embedding: EmbeddingClient,
    texts: list[str],
    batch_idx: int,
) -> list[list[float]]:
    """Embed a batch with exponential-backoff retry on failure."""
    for attempt in range(MAX_RETRIES):
        try:
            return embedding.embed_texts(texts)
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                delay = RETRY_BASE_DELAY * (2 ** attempt)
                print(f"   [WARN] Embedding batch {batch_idx} failed (attempt {attempt + 1}): {e}")
                print(f"          Retrying in {delay}s...")
                time.sleep(delay)
            else:
                print(f"   [ERROR] Embedding batch {batch_idx} failed after {MAX_RETRIES} attempts — filling with zero vectors")
                return [[0.0] * 768 for _ in texts]


async def _seed_products_async():
    settings = get_settings()
    qdrant = QdrantService()
    embedding = EmbeddingClient()

    print("=" * 60)
    print("Seed Health Products")
    print("=" * 60)

    print("\n[1/3] Fetching products from Java Backend...")
    try:
        docs = await fetch_all_products()
    except Exception as e:
        print(f"[FAIL] Failed to fetch products: {e}")
        return

    print(f"   Fetched {len(docs)} products from BE")

    print("\n[2/3] Building product documents...")
    if not docs:
        print("[FAIL] No product docs. Check BE is running at http://localhost:8080")
        return
    print(f"   Built {len(docs)} product docs")

    print(f"\n[3/3] Embedding + upserting to Qdrant (batch {EMBED_BATCH_SIZE})...")
    _ = embedding.model  # warm up — load model once

    total_upserted = 0
    failed_batches = 0
    embed_batches = (len(docs) + EMBED_BATCH_SIZE - 1) // EMBED_BATCH_SIZE

    for batch_idx in range(embed_batches):
        start = batch_idx * EMBED_BATCH_SIZE
        end = min(start + EMBED_BATCH_SIZE, len(docs))
        batch_docs = docs[start:end]
        batch_texts = [d.text for d in batch_docs]

        embeddings = embed_batch_with_retry(embedding, batch_texts, batch_idx)

        points = [
            {
                "id": doc.product_id,
                "vector": emb,
                "payload": doc.to_payload(),
            }
            for doc, emb in zip(batch_docs, embeddings)
        ]

        qdrant.upsert_points(
            collection_name=settings.collection_products,
            points=points,
            batch_size=UPSERT_BATCH_SIZE,
        )
        total_upserted += len(points)

        all_zero = all(all(v == 0.0 for v in p["vector"]) for p in points)
        if all_zero:
            failed_batches += 1

        print(f"   Batch {batch_idx + 1}/{embed_batches} done — {total_upserted}/{len(docs)} upserted")

    print(f"\n{'=' * 60}")
    print(f"Done! Upserted {total_upserted} products to '{settings.collection_products}'")
    if failed_batches:
        print(f"[WARN] {failed_batches} batch(es) failed to embed — check zero-vector points")
    print(f"{'=' * 60}")


def seed_products():
    asyncio.run(_seed_products_async())


if __name__ == "__main__":
    seed_products()
