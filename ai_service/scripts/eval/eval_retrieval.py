"""Eval retrieval quality -- test semantic search against ingested chunks.

Requires: Qdrant running, chunks already seeded via seed_health.py
Usage  : python scripts/eval_retrieval.py
"""
import sys
import io

from pathlib import Path

class Tee:
    def __init__(self, name, orig_stream):
        self.file = open(name, "w", encoding="utf-8")
        if hasattr(orig_stream, "buffer"):
            self.stream = io.TextIOWrapper(orig_stream.buffer, encoding="utf-8", errors="replace")
        else:
            self.stream = orig_stream

    def write(self, data):
        self.file.write(data)
        self.stream.write(data)

    def flush(self):
        self.file.flush()
        self.stream.flush()

out_path = Path(__file__).parent / "eval_retrieval_results.txt"
sys.stdout = Tee(out_path, sys.stdout)
sys.stderr = Tee(out_path, sys.stderr)

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.config import get_settings
from src.services.qdrant_client import QdrantService
from src.services.embedding_client import EmbeddingClient
from data_ingestion.health_synonyms import expand_health_query
from src.core.rerank import rerank_health_hits


TEST_QUERIES = [
    ("Thoai hoa khop goi la gi?", "dinh nghia, trieu chung, nguyen nhan thoai hoa khop goi"),
    ("Dau day than kinh lien suon", "trieu chung va cach dieu tri dau day than kinh lien suon"),
    ("Cach chua thoat vi dia dem", "phuong phap dieu tri thoat vi dia dem"),
    ("Dau vai gay", "nguyen nhan, trieu chung, cach tri dau vai gay"),
    ("Viem khop dang that", "trieu chung, nguyen nhan viem khop dang that"),
    ("Mat ngu kinh nien", "cach dieu tri mat ngu"),
    ("Dau lung gian day chang", "nguyen nhan va cach tri dau lung"),
    ("Roi loan tien dinh", "trieu chung va cach dieu tri roi loan tien dinh"),
    ("Thoai hoa cot song co", "trieu chung va cach tri thoai hoa cot song co"),
    ("Dau nhuc xuong khop", "nguyen nhan va cach dieu tri dau nhuc xuong khop"),
]


def eval_retrieval(top_k: int = 5, score_threshold: float = 0.0):
    settings = get_settings()
    qdrant = QdrantService()
    embedding = EmbeddingClient()

    info = qdrant.get_collection_info(settings.collection_articles)
    if not info:
        print(f"[FAIL] Collection '{settings.collection_articles}' not found.")
        print("  Run: python scripts/seed_health.py first.")
        return

    print(f"Collection: {info['name']} | Points: {info['points_count']}")
    print(f"Running {len(TEST_QUERIES)} test queries (top_k={top_k})...\n")

    _ = embedding.model  # warm up

    results_summary = []
    for question, expectation in TEST_QUERIES:
        expanded = expand_health_query(question)
        if expanded != question:
            print(f"  [EXPAND] {question} → {expanded}")
        query_vec = embedding.embed_text(expanded)
        hits = qdrant.search(
            collection_name=settings.collection_articles,
            query_vector=query_vec,
            limit=20,
            score_threshold=0.0,
        )

        # Apply hybrid reranking
        reranked = rerank_health_hits(expanded, hits)

        print("=" * 60)
        print(f"Q: {question}")
        print(f"  Expected to find: {expectation}")
        print(f"  Top-{len(hits)} results (reranked):")
        for i, scored in enumerate(reranked[:5], 1):
            payload = scored.payload
            score = scored.combined_score
            orig = scored.original_score
            section = payload.get("section_title", "(no section)")
            article = payload.get("article_title", "(no title)")
            content = payload.get("content", "")[:200]
            chunk_idx = payload.get("chunk_index", 0)
            total = payload.get("total_chunks", 1)

            flag = "[OK]" if score >= 0.5 else ("[~]" if score >= 0.3 else "[!!]")
            print(f"  {flag} #{i} combined={score:.3f} (vec={orig:.3f}, kw={scored.keyword_score:.3f}, title={scored.title_score:.1f}) | chunk={chunk_idx}/{total} | [{section}]")
            print(f"      Article : {article}")
            print(f"      Content : {content}...")
            print()

        results_summary.append({
            "question": question,
            "expectation": expectation,
            "top_score": reranked[0].combined_score if reranked else 0.0,
            "all_scores": [h.combined_score for h in reranked[:5]],
        })

    print("=" * 60)
    print("SUMMARY TABLE")
    print("=" * 60)
    print(f"  {'#':<3} {'Question':<45} {'Top Score':>10} {'Score Spread':>20}")
    print("-" * 80)
    for i, r in enumerate(results_summary, 1):
        spread = f"{min(r['all_scores']):.3f}-{max(r['all_scores']):.3f}"
        flag = "[OK]" if r["top_score"] >= 0.4 else ("[~]" if r["top_score"] >= 0.3 else "[!!]")
        q_short = r["question"][:43] + ".." if len(r["question"]) > 45 else r["question"]
        print(f"  {flag} {i:<2} {q_short:<45} {r['top_score']:>10.3f} {spread:>20}")

    avg_top = sum(r["top_score"] for r in results_summary) / len(results_summary)
    print("-" * 80)
    print(f"  Average top-score: {avg_top:.3f}")
    print()
    print("  INTERPRETATION:")
    print("    Score >= 0.5  : Very good -- chunk is highly relevant")
    print("    Score 0.3-0.5: OK -- relevant but may miss nuance")
    print("    Score < 0.3  : Poor  -- wrong chunk retrieved, chunking may be the cause")
    print()
    print("  If many scores < 0.3:")
    print("    1. Chunking may be splitting context badly")
    print("    2. Embedding model may not capture medical terms well")
    print("    3. Query and chunk language mismatch")
    print("  If scores are 0.3-0.5:")
    print("    Chunking is acceptable but try increasing max_chars or adding overlap")


def main():
    eval_retrieval(top_k=5, score_threshold=0.0)


if __name__ == "__main__":
    main()
