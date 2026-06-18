"""Setup Qdrant collections for health articles and products."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import get_settings
from src.services.qdrant_client import QdrantService
from src.services.embedding_client import EmbeddingClient


def setup_qdrant():
    """Create and verify Qdrant collections."""
    settings = get_settings()
    qdrant = QdrantService()
    embedding = EmbeddingClient()

    print("=" * 50)
    print("Qdrant Setup Script")
    print("=" * 50)

    # Verify Qdrant connection
    print("\n1. Testing Qdrant connection...")
    try:
        collections = qdrant.list_collections()
        print(f"   [OK] Connected to Qdrant at {qdrant.host}:{qdrant.port}")
        print(f"   Existing collections: {collections}")
    except Exception as e:
        print(f"   [FAIL] Failed to connect: {e}")
        print("   Make sure Qdrant is running (docker-compose up -d qdrant)")
        return

    # Verify embedding dimension
    print("\n2. Testing embedding client...")
    try:
        dim = embedding.get_embedding_dimension()
        print(f"   [OK] Embedding model: {embedding.model_name}")
        print(f"   [OK] Embedding dimension: {dim}")
    except Exception as e:
        print(f"   [FAIL] Failed to get embedding dimension: {e}")
        print("   Make sure sentence-transformers is installed and the model can be downloaded.")
        return

    # Check if dimensions match
    if dim != settings.vector_size:
        print(f"\n   [WARN] Embedding dimension ({dim}) differs from config ({settings.vector_size})")
        print(f"   Updating vector_size in config to {dim}")
        settings.vector_size = dim

    # Create collections
    print("\n3. Creating collections...")

    # Health Articles collection
    print(f"\n   Collection: {settings.collection_articles}")
    qdrant.create_collection(
        collection_name=settings.collection_articles,
        vector_size=settings.vector_size,
        force_recreate=False,
    )

    # Health Products collection
    print(f"\n   Collection: {settings.collection_products}")
    qdrant.create_collection(
        collection_name=settings.collection_products,
        vector_size=settings.vector_size,
        force_recreate=False,
    )

    # Final summary
    print("\n" + "=" * 50)
    print("Setup Complete!")
    print("=" * 50)
    print(f"\nCollections created:")
    for name in [settings.collection_articles, settings.collection_products]:
        info = qdrant.get_collection_info(name)
        if info:
            print(f"  - {name}: {info['points_count']} points, status={info['status']}")
        else:
            print(f"  - {name}: not found")

    print(f"\nVector size: {settings.vector_size}")
    print(f"Distance metric: COSINE")


if __name__ == "__main__":
    setup_qdrant()
