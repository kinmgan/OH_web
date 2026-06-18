"""Eval retrieval quality -- test semantic search against ingested products.

Requires: Qdrant running, products already seeded via seed_products.py
Usage  : python scripts/eval/eval_product_retrieval.py
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

out_path = Path(__file__).parent / "eval_product_retrieval_results.txt"
sys.stdout = Tee(out_path, sys.stdout)
sys.stderr = Tee(out_path, sys.stderr)

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.config import get_settings
from src.services.qdrant_client import QdrantService
from src.services.embedding_client import EmbeddingClient
from data_ingestion.tcm_synonyms import expand_query
from src.core.rerank import rerank_product_hits


TEST_QUERIES = [
    {
        "query": "Thuốc trị đau dạ dày",
        "expected_categories": ["Hệ tiêu hóa"],
    },
    {
        "query": "Thuốc bồi bổ cơ thể",
        "expected_categories": ["Bồi bổ & Tăng cường"],
    },
    {
        "query": "Chữa đau nhức xương khớp",
        "expected_categories": ["Xương khớp & Tê thấp"],
    },
    {
        "query": "Thuốc trị viêm họng",
        "expected_categories": ["Hệ hô hấp", "Thanh nhiệt & Giải độc"],
    },
    {
        "query": "Sản phẩm bổ thận tráng dương",
        "expected_categories": ["Bồi bổ & Tăng cường", "Phụ khoa & Nam khoa"],
    },
    {
        "query": "Thuốc trị tiêu chảy",
        "expected_categories": ["Hệ tiêu hóa"],
    },
    {
        "query": "Thuốc chữa táo bón",
        "expected_categories": ["Hệ tiêu hóa"],
    },
    {
        "query": "Thuốc trị ho",
        "expected_categories": ["Hệ hô hấp"],
    },
    {
        "query": "Thuốc trị cảm cúm",
        "expected_categories": ["Hệ hô hấp", "Thanh nhiệt & Giải độc", "Xương khớp & Tê thấp"], # Đông Y chữa cảm cúm có thể có các vị thuốc khu phong tán hàn, giải biểu
    },
    {
        "query": "Thuốc bổ âm",
        "expected_categories": ["Bồi bổ & Tăng cường"],
    },
    {
        "query": "Thuốc thanh nhiệt giải độc",
        "expected_categories": ["Thanh nhiệt & Giải độc"],
    },
]


def eval_product_retrieval(top_k: int = 5, score_threshold: float = 0.0):
    settings = get_settings()
    qdrant = QdrantService()
    embedding = EmbeddingClient()

    info = qdrant.get_collection_info(settings.collection_products)
    if not info:
        print(f"[FAIL] Collection '{settings.collection_products}' not found.")
        print("  Run: python scripts/seed_products.py first.")
        return

    print(f"Collection: {info['name']} | Points: {info['points_count']}")
    print(f"Running {len(TEST_QUERIES)} test queries (top_k={top_k})...\n")

    _ = embedding.model  # warm up

    results_summary = []
    for test_case in TEST_QUERIES:
        question = test_case["query"]
        expected_categories = test_case["expected_categories"]

        expanded = expand_query(question)
        query_vec = embedding.embed_text(expanded)
        hits = qdrant.search(
            collection_name=settings.collection_products,
            query_vector=query_vec,
            limit=top_k * 2,  # Fetch more for reranking
            score_threshold=score_threshold,
        )

        raw_for_rerank = [{"score": h["score"], "payload": h["payload"]} for h in hits]
        reranked_hits = rerank_product_hits(question, raw_for_rerank)
        final_hits = reranked_hits[:top_k]

        print("=" * 60)
        print(f"Q: {question}")
        if expanded != question:
            print(f"  (expanded → {expanded})")
        print(f"  Expected categories: {', '.join(expected_categories)}")
        print(f"  Top-{len(final_hits)} results (reranked):")
        
        correct_hits = 0
        for i, hit in enumerate(final_hits, 1):
            payload = hit.payload
            score = hit.combined_score
            product_name = payload.get("name", "(no name)")
            category = payload.get("category", "(no category)")
            min_price = payload.get("min_price", "(no price)")

            is_correct = any(expected in category for expected in expected_categories)
            if is_correct:
                correct_hits += 1

            flag = "[✓]" if is_correct else "[x]"
            print(f"  {flag} #{i} score={score:.3f} | [{category}]")
            print(f"      Product : {product_name}")
            print(f"      Price   : {min_price}")
            print()

        precision_at_k = correct_hits / len(final_hits) if final_hits else 0.0
        success = 1 if correct_hits > 0 else 0

        results_summary.append({
            "question": question,
            "expected_categories": ", ".join(expected_categories),
            "precision": precision_at_k,
            "success": success,
        })

    print("=" * 85)
    print("SUMMARY TABLE (IR METRICS)")
    print("=" * 85)
    print(f"  {'#':<3} {'Question':<40} {'Expected Category':<25} {'P@5':>6} {'Success':>8}")
    print("-" * 85)
    total_precision = 0.0
    total_success = 0
    for i, r in enumerate(results_summary, 1):
        total_precision += r["precision"]
        total_success += r["success"]
        q_short = r["question"][:38] + ".." if len(r["question"]) > 40 else r["question"]
        cat_short = r["expected_categories"][:23] + ".." if len(r["expected_categories"]) > 25 else r["expected_categories"]
        print(f"  {i:<3} {q_short:<40} {cat_short:<25} {r['precision']:>6.2f} {r['success']:>8}")

    if results_summary:
        avg_precision = total_precision / len(results_summary)
        success_rate = total_success / len(results_summary)
        print("-" * 85)
        print(f"  Mean Precision@{top_k}: {avg_precision:.2%}")
        print(f"  Success Rate (Hit Rate): {success_rate:.2%}")
    print()
    print("  INTERPRETATION:")
    print(f"    Precision@{top_k}: % of top-{top_k} results that match expected categories.")
    print(f"    Success Rate : % of queries that have at least 1 correct result in top-{top_k}.")


def main():
    eval_product_retrieval(top_k=5, score_threshold=0.0)


if __name__ == "__main__":
    main()
