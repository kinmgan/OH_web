"""Qdrant vector database client."""
from qdrant_client import QdrantClient, models
from typing import Optional


class QdrantService:
    """Client for Qdrant vector database operations.

    Tương thích qdrant-client >= 1.10 (dùng `query_points` thay vì `search`).
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        api_key: Optional[str] = None,
    ):
        from src.config import get_settings
        settings = get_settings()
        self.host = host or settings.qdrant_host
        self.port = port or settings.qdrant_port
        self.grpc_port = settings.qdrant_grpc_port
        self.api_key = api_key or settings.qdrant_api_key
        self._client: Optional[QdrantClient] = None

    @property
    def client(self) -> QdrantClient:
        if self._client is None:
            self._client = QdrantClient(
                host=self.host,
                port=self.port,
                api_key=self.api_key if self.api_key else None,
            )
        return self._client

    def create_collection(
        self,
        collection_name: str,
        vector_size: int,
        distance: models.Distance = models.Distance.COSINE,
        force_recreate: bool = False,
    ) -> bool:
        """Create a collection if it doesn't exist."""
        collections = self.client.get_collections().collections
        exists = any(c.name == collection_name for c in collections)

        if exists:
            if force_recreate:
                self.client.delete_collection(collection_name)
                print(f"Deleted existing collection: {collection_name}")
            else:
                print(f"Collection '{collection_name}' already exists.")
                return False

        self.client.create_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(
                size=vector_size,
                distance=distance,
            ),
        )
        print(f"Created collection: {collection_name} (vector_size={vector_size})")
        return True

    def upsert_points(
        self,
        collection_name: str,
        points: list[dict],
        batch_size: int = 100,
    ) -> int:
        """Insert or update points in a collection."""
        from qdrant_client.models import PointStruct

        qdrant_points = []
        for point in points:
            qdrant_points.append(
                PointStruct(
                    id=point["id"],
                    vector=point["vector"],
                    payload=point.get("payload", {}),
                )
            )

        total = 0
        for i in range(0, len(qdrant_points), batch_size):
            batch = qdrant_points[i : i + batch_size]
            self.client.upsert(
                collection_name=collection_name,
                points=batch,
            )
            total += len(batch)
            print(f"Upserted {total}/{len(qdrant_points)} points to {collection_name}")

        return total

    def upsert(self, collection_name: str, points: list) -> int:
        """Alias linh hoạt — chấp nhận dict hoặc PointStruct."""
        normalized: list[dict] = []
        for p in points:
            if isinstance(p, dict):
                normalized.append(p)
            else:
                normalized.append(
                    {
                        "id": getattr(p, "id", None),
                        "vector": getattr(p, "vector", None),
                        "payload": getattr(p, "payload", {}) or {},
                    }
                )
        return self.upsert_points(collection_name, normalized)

    def search(
        self,
        collection_name: str,
        query_vector: list[float],
        limit: int = 5,
        score_threshold: Optional[float] = None,
        query_filter: Optional[models.Filter] = None,
    ) -> list[dict]:
        """Search for similar vectors.

        Dùng `query_points` (qdrant-client >= 1.10). Method `search` đã bị
        loại bỏ trong các bản mới.
        """
        if hasattr(self.client, "query_points"):
            results = self.client.query_points(
                collection_name=collection_name,
                query=query_vector,
                limit=limit,
                score_threshold=score_threshold,
                query_filter=query_filter,
            )
            points = results.points
        else:
            points = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                score_threshold=score_threshold,
                query_filter=query_filter,
            )

        return [
            {
                "id": point.id,
                "score": point.score,
                "payload": point.payload,
            }
            for point in points
        ]

    def get_collection_info(self, collection_name: str) -> Optional[dict]:
        """Get information about a collection."""
        try:
            info = self.client.get_collection(collection_name)
            return {
                "name": collection_name,
                "vectors_count": getattr(info, "indexed_vectors_count", info.points_count),
                "points_count": info.points_count,
                "status": str(info.status),
            }
        except Exception:
            return None

    def delete_collection(self, collection_name: str) -> bool:
        """Delete a collection."""
        try:
            self.client.delete_collection(collection_name)
            print(f"Deleted collection: {collection_name}")
            return True
        except Exception as e:
            print(f"Error deleting collection: {e}")
            return False

    def list_collections(self) -> list[str]:
        """List all collections."""
        return [c.name for c in self.client.get_collections().collections]
