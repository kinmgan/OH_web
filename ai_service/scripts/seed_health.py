"""Seed health articles (markdown files) into Qdrant health_articles collection."""
import sys
import hashlib
import time
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import get_settings
from src.services.qdrant_client import QdrantService
from src.services.embedding_client import EmbeddingClient
from data_ingestion.health_ingestion import ingest_directory, Chunk


OUTPUT_DIR = Path(__file__).parent.parent / "data_ingestion" / "crawlers" / "output"

EMBED_BATCH_SIZE = 256
UPSERT_BATCH_SIZE = 100
MAX_RETRIES = 3
RETRY_BASE_DELAY = 5  # seconds


def _make_point_id(file_path: str, chunk_index: int) -> str:
    """Stable UUID v4 from file path + chunk index."""
    raw = f"{file_path}:{chunk_index}"
    h = hashlib.md5(raw.encode("utf-8")).hexdigest()
    return str(uuid.UUID(h))


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


def seed_health(force_recreate: bool = True):
    settings = get_settings()
    qdrant = QdrantService()
    embedding = EmbeddingClient()

    print("=" * 60)
    print("Seed Health Articles")
    print("=" * 60)

    if not OUTPUT_DIR.exists():
        print(f"[FAIL] Output directory not found: {OUTPUT_DIR}")
        return

    md_count = len(list(OUTPUT_DIR.rglob("*.md")))
    print(f"\n[1/3] Scanning {OUTPUT_DIR} ... found {md_count} .md files")

    print("\n[2/3] Chunking articles...")
    chunks = ingest_directory(OUTPUT_DIR)

    if not chunks:
        print("[FAIL] No chunks produced. Check crawler output.")
        return

    total_chunks = len(chunks)
    print(f"   Produced {total_chunks} chunks")

    print(f"\n[3/3] Embedding + upserting to Qdrant (batch {EMBED_BATCH_SIZE})...")

    if force_recreate:
        print(f"   Recreating collection '{settings.collection_articles}'...")
        try:
            qdrant.delete_collection(settings.collection_articles)
        except Exception:
            pass
        qdrant.create_collection(
            collection_name=settings.collection_articles,
            vector_size=embedding.get_embedding_dimension(),
            force_recreate=False,
        )

    _ = embedding.model  # warm up — load model once

    total_upserted = 0
    failed_batches = 0
    embed_batches = (total_chunks + EMBED_BATCH_SIZE - 1) // EMBED_BATCH_SIZE

    for batch_idx in range(embed_batches):
        start = batch_idx * EMBED_BATCH_SIZE
        end = min(start + EMBED_BATCH_SIZE, total_chunks)
        batch_chunks = chunks[start:end]
        batch_texts = [c.build_search_text() for c in batch_chunks]

        embeddings = embed_batch_with_retry(embedding, batch_texts, batch_idx)

        points = [
            {
                "id": _make_point_id(chunk.file_path, chunk.chunk_index),
                "vector": emb,
                "payload": chunk.to_payload(),
            }
            for chunk, emb in zip(batch_chunks, embeddings)
        ]

        qdrant.upsert_points(
            collection_name=settings.collection_articles,
            points=points,
            batch_size=UPSERT_BATCH_SIZE,
        )
        total_upserted += len(points)

        all_zero = all(all(v == 0.0 for v in p["vector"]) for p in points)
        if all_zero:
            failed_batches += 1

        print(f"   Batch {batch_idx + 1}/{embed_batches} done — {total_upserted}/{total_chunks} upserted")

    print(f"\n{'=' * 60}")
    print(f"Done! Upserted {total_upserted} chunks to '{settings.collection_articles}'")
    if failed_batches:
        print(f"[WARN] {failed_batches} batch(es) failed to embed — check zero-vector points")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    seed_health()
