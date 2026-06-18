"""Re-seed health_products collection using ONLY data/product_detail_cache.json.

Use this when:
  - Java BE is not running locally
  - We just want to re-embed with new _build_text() logic without re-fetching

Run: python scripts/reseed_from_cache.py
"""
import sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).parent.parent))

import time
import json

from src.config import get_settings
from src.services.qdrant_client import QdrantService
from src.services.embedding_client import EmbeddingClient
from data_ingestion.product_ingestion import build_product_docs

CACHE = Path(__file__).parent.parent / "data" / "product_detail_cache.json"

EMBED_BATCH_SIZE = 256
UPSERT_BATCH_SIZE = 100


def main():
    settings = get_settings()
    qdrant = QdrantService()
    embedding = EmbeddingClient()

    print("=" * 60)
    print("Re-seed Health Products from Cache")
    print("=" * 60)

    print("\n[1/4] Loading cache...")
    cache = json.loads(CACHE.read_text(encoding="utf-8"))
    products = list(cache.values())
    print(f"   Loaded {len(products)} products from cache")

    print("\n[2/4] Building ProductDoc (with NEW _build_text)...")
    docs = build_product_docs(products)
    print(f"   Built {len(docs)} docs")

    # Quick sample of text stats
    lengths = [len(d.text) for d in docs]
    if lengths:
        print(f"   Text length: min={min(lengths)}  max={max(lengths)}  "
              f"avg={sum(lengths)/len(lengths):.0f}")

    print("\n[3/4] Recreating collection (delete + re-create to avoid stale vectors)...")
    try:
        qdrant.delete_collection(settings.collection_products)
        print(f"   Deleted '{settings.collection_products}'")
    except Exception as e:
        print(f"   [WARN] delete_collection: {e}")

    qdrant.create_collection(
        collection_name=settings.collection_products,
        vector_size=settings.vector_size,
        distance="Cosine",
    )
    print(f"   Created '{settings.collection_products}' (vector_size={settings.vector_size})")

    print(f"\n[4/4] Embedding + upserting (batch {EMBED_BATCH_SIZE})...")
    _ = embedding.model  # warm up

    total = 0
    embed_batches = (len(docs) + EMBED_BATCH_SIZE - 1) // EMBED_BATCH_SIZE
    t0 = time.time()
    for batch_idx in range(embed_batches):
        start = batch_idx * EMBED_BATCH_SIZE
        end = min(start + EMBED_BATCH_SIZE, len(docs))
        batch = docs[start:end]
        texts = [d.text for d in batch]
        try:
            vectors = embedding.embed_texts(texts)
        except Exception as e:
            print(f"   [ERROR] batch {batch_idx}: {e}")
            continue
        points = [
            {"id": d.product_id, "vector": v, "payload": d.to_payload()}
            for d, v in zip(batch, vectors)
        ]
        qdrant.upsert_points(
            collection_name=settings.collection_products,
            points=points,
            batch_size=UPSERT_BATCH_SIZE,
        )
        total += len(points)
        print(f"   Batch {batch_idx + 1}/{embed_batches} done — {total}/{len(docs)} upserted")

    elapsed = time.time() - t0
    print(f"\n{'=' * 60}")
    print(f"Done! {total} products upserted in {elapsed:.1f}s")
    print(f"Collection: {settings.collection_products}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
