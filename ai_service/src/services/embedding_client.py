"""Embedding service using BKAI Vietnamese bi-encoder (sentence-transformers)."""
from typing import List
from sentence_transformers import SentenceTransformer
from src.config import get_settings


class EmbeddingClient:
    """Client for generating text embeddings using BKAI Vietnamese bi-encoder."""

    def __init__(self, model_name: str = "bkai-foundation-models/vietnamese-bi-encoder"):
        settings = get_settings()
        self.model_name = model_name
        self._model = None

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        return self.model.encode(text, normalize_embeddings=True).tolist()

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        return self.model.encode(texts, normalize_embeddings=True).tolist()

    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings produced by this model."""
        test_emb = self.embed_text("test")
        return len(test_emb)
