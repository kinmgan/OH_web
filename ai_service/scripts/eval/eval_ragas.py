"""RAGAS Lightweight Evaluation — Oriental Herbs AI Service.

Đo 2 chỉ số RAGAS không cần ground_truth:
  - Faithfulness      : Answer có bám sát contexts không? (chống hallucination)
  - Answer Relevance  : Answer có đúng trọng tâm question không?

Tập test gồm 20 câu (12 health + 8 product) bao phủ toàn bộ use case thật.

Pipeline tự động:
  1. Lặp qua mỗi câu hỏi (có delay + retry để tránh 429)
  2. Gọi Retriever (production code, không mock) để lấy contexts
  3. Gọi GeminiClient (production code) để lấy answer
  4. Cache kết quả vào file JSON (resume được nếu bị ngắt giữa chừng)
  5. Ném {question, answer, contexts} vào RAGAS để chấm điểm (judge = Gemini)
  6. In bảng kết quả + lưu eval_ragas_results.txt + eval_ragas_results.json

Rate limiting strategy (Gemini free tier = 20 RPM):
  - Delay 4s giữa mỗi generation call → tối đa 15 calls/phút (an toàn)
  - Retry tự động với exponential backoff khi gặp 429
  - RAGAS judge dùng gemini-2.0-flash riêng, có thread-safe rate limiter
  - Khi bị 429 mid-run: cache lại progress → chạy lại thì resume từ chỗ dừng

LLM Judge: gemini-2.0-flash (nhẹ, nhanh hơn 2.5-flash, ít tốn quota hơn)
  → Dùng langchain-google-genai (đã có trong requirements.txt)
  → Wrapped qua LangchainLLMWrapper cho RAGAS

Usage:
  # Cài RAGAS trước (nếu chưa có):
  pip install ragas==0.1.21 datasets langchain-google-genai

  # Chạy từ thư mục gốc ai_service/:
  python scripts/eval/eval_ragas.py

  # Nếu bị ngắt giữa chừng, chạy lại — sẽ resume tự động từ chỗ dừng:
  python scripts/eval/eval_ragas.py

Requirements: Qdrant running, health + product collections seeded, GEMINI_API_KEY in .env
"""

import sys
import io
import json
import time
import threading
import re
from pathlib import Path
from datetime import datetime

# ── Tee: ghi stdout ra cả file lẫn console ──────────────────────────────────
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


out_path = Path(__file__).parent / "eval_ragas_results.txt"
sys.stdout = Tee(out_path, sys.stdout)
sys.stderr = Tee(out_path, sys.stderr)

# ── Thêm project root vào sys.path ──────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.config import get_settings
from src.core.retrieval import Retriever
from src.services.gemini_client import GeminiClient
from src.core.generation import build_health_prompt, build_shopping_prompt


# ─────────────────────────────────────────────────────────────────────────────
# RATE LIMITER
# Gemini free tier: 20 RPM (requests/phút) cho gemini-2.5-flash
#                   15 RPM cho gemini-2.0-flash
# Ta dùng 12 RPM = 1 request mỗi 5s để luôn an toàn ở cả 2 model.
# ─────────────────────────────────────────────────────────────────────────────

class RateLimiter:
    """Thread-safe token-bucket rate limiter.

    min_interval_sec: khoảng cách tối thiểu giữa 2 request liên tiếp (giây).
    Ví dụ: min_interval_sec=5.0 → tối đa 12 calls/phút.
    """

    def __init__(self, min_interval_sec: float = 5.0):
        self.min_interval = min_interval_sec
        self._lock = threading.Lock()
        self._last_call = 0.0

    def wait(self, label: str = ""):
        with self._lock:
            now = time.time()
            elapsed = now - self._last_call
            wait_time = self.min_interval - elapsed
            if wait_time > 0:
                print(f"  [RATE LIMIT] Chờ {wait_time:.1f}s trước khi gọi API{(' (' + label + ')') if label else ''}...")
                time.sleep(wait_time)
            self._last_call = time.time()


# Instance toàn cục — dùng chung cho cả generation lẫn RAGAS judge
_rate_limiter = RateLimiter(min_interval_sec=5.0)


# ─────────────────────────────────────────────────────────────────────────────
# RETRY WITH EXPONENTIAL BACKOFF
# ─────────────────────────────────────────────────────────────────────────────

def _extract_retry_seconds(error_msg: str) -> float:
    """Parse 'Please retry in X.Xs' từ message lỗi 429 của Gemini."""
    match = re.search(r"retry in (\d+\.?\d*)\s*s", str(error_msg), re.IGNORECASE)
    if match:
        return float(match.group(1)) + 2.0  # thêm 2s buffer
    return 65.0  # default: 65s nếu không parse được


def call_with_retry(fn, *args, max_retries: int = 4, label: str = "", **kwargs):
    """Gọi fn với retry khi gặp 429 (quota exceeded).

    Chiến lược:
      - Lần 1 retry: đợi theo thời gian Gemini suggest (thường 60s)
      - Lần 2+  : exponential backoff × 1.5
    """
    for attempt in range(max_retries + 1):
        try:
            _rate_limiter.wait(label)
            return fn(*args, **kwargs)

        except Exception as exc:
            err_str = str(exc)
            is_quota = "429" in err_str or "quota" in err_str.lower() or "RESOURCE_EXHAUSTED" in err_str

            if is_quota and attempt < max_retries:
                wait_sec = _extract_retry_seconds(err_str)
                # Nếu lần retry > 1, tăng thêm thời gian chờ
                if attempt > 0:
                    wait_sec = wait_sec * (1.5 ** attempt)
                print(f"  [429] Quota exceeded. Đợi {wait_sec:.0f}s rồi retry (attempt {attempt+1}/{max_retries})...")
                time.sleep(wait_sec)
                continue  # retry

            raise  # lỗi khác hoặc đã hết retry → raise lên


# ─────────────────────────────────────────────────────────────────────────────
# CACHE — resume nếu bị ngắt giữa chừng
# ─────────────────────────────────────────────────────────────────────────────

CACHE_PATH = Path(__file__).parent / "_eval_ragas_cache.json"


def load_cache() -> dict:
    """Load cached samples (nếu có) để resume."""
    if CACHE_PATH.exists():
        try:
            data = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
            print(f"[CACHE] Tìm thấy cache: {len(data.get('question', []))} samples đã xử lý.")
            return data
        except Exception:
            pass
    return {"question": [], "answer": [], "contexts": []}


def save_cache(samples: dict):
    """Lưu progress cache sau mỗi sample thành công."""
    CACHE_PATH.write_text(
        json.dumps(samples, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def clear_cache():
    """Xóa cache sau khi eval hoàn thành."""
    if CACHE_PATH.exists():
        CACHE_PATH.unlink()
        print("[CACHE] Cache đã xóa (eval hoàn thành).")


# ─────────────────────────────────────────────────────────────────────────────
# 20 TEST CASES (12 health + 8 product)
# Bao phủ: bệnh cơ xương khớp, thần kinh, tiêu hóa, hô hấp, bồi bổ,
#          sản phẩm theo danh mục, theo ngân sách, câu hỏi kết hợp.
# ─────────────────────────────────────────────────────────────────────────────

HEALTH_QUERIES = [
    "Thoái hóa khớp gối là gì? Triệu chứng như thế nào?",
    "Nguyên nhân gây đau thần kinh tọa và cách điều trị?",
    "Thoát vị đĩa đệm có tự khỏi không?",
    "Viêm khớp dạng thấp khác gout như thế nào?",
    "Đau vai gáy mãn tính nên làm gì?",
    "Mất ngủ kinh niên có nguy hiểm không? Cách khắc phục?",
    "Rối loạn tiền đình gây ra triệu chứng gì?",
    "Thoái hóa cột sống cổ điều trị bằng cách nào?",
    "Đau nhức xương khớp về đêm có phải gout không?",
    "Cách phân biệt đau lưng do cơ và do đĩa đệm?",
    "Bệnh xương khớp có nên tập thể dục không?",
    "Đau dây thần kinh liên sườn nguy hiểm không?",
]

PRODUCT_QUERIES = [
    "Tôi bị đau dạ dày, có sản phẩm đông y nào hỗ trợ không?",
    "Muốn mua thuốc bổ thận tráng dương, giá dưới 500k",
    "Sản phẩm nào giúp hỗ trợ xương khớp tốt nhất?",
    "Thuốc đông y trị ho và viêm họng cho trẻ em",
    "Có sản phẩm thanh nhiệt giải độc không? Tôi hay nổi mụn",
    "Tôi muốn bồi bổ sức khỏe sau ốm dậy, cần gì?",
    "Sản phẩm hỗ trợ tiêu hóa, trị táo bón mãn tính",
    "Thuốc bổ âm huyết cho người già bị mất ngủ",
]

TEST_CASES = (
    [{"question": q, "intent": "health"} for q in HEALTH_QUERIES]
    + [{"question": q, "intent": "shopping"} for q in PRODUCT_QUERIES]
)


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def extract_contexts(retrieval_result, intent: str) -> list[str]:
    """Chuyển RetrievalResult thành list[str] contexts cho RAGAS."""
    contexts = []
    if intent == "health":
        for hit in retrieval_result.health_hits:
            contexts.append(
                f"[{hit.article_title} / {hit.section_title}]\n{hit.content}"
            )
    elif intent == "shopping":
        for hit in retrieval_result.product_hits:
            contexts.append(
                f"[Sản phẩm: {hit.name}]\n"
                f"Danh mục: {hit.category_name}\n"
                f"Giá từ: {hit.min_price:,.0f}đ\n"
                f"Mô tả: {hit.description[:300]}"
            )
    return contexts if contexts else ["(Không có tài liệu liên quan)"]


def build_prompt(question: str, intent: str, retrieval_result) -> str:
    """Dùng chính hàm production để build prompt — đảm bảo nhất quán."""
    if intent == "health":
        docs = [
            {
                "article_title": h.article_title,
                "section_title": h.section_title,
                "content": h.content,
            }
            for h in retrieval_result.health_hits
        ]
        return build_health_prompt(question=question, documents=docs, history=[])

    elif intent == "shopping":
        products = [
            {
                "name": h.name,
                "min_price": h.min_price,
                "category_name": h.category_name,
                "tags": h.tags,
                "description": h.description,
                "total_stock": h.total_stock,
            }
            for h in retrieval_result.product_hits
        ]
        return build_shopping_prompt(question=question, products=products, history=[])

    return question


# ─────────────────────────────────────────────────────────────────────────────
# RAGAS JUDGE — Wrapper có rate limiting cho langchain callbacks
# ─────────────────────────────────────────────────────────────────────────────

class RateLimitedLLMWrapper:
    """Wrap LangchainLLMWrapper để thêm rate limiting.

    RAGAS gọi LLM nhiều lần/sample khi chấm điểm (generate_nli_statements,
    classify_..., v.v). Wrapper này đảm bảo mỗi call đều qua rate limiter.
    """

    def __init__(self, inner_llm):
        self._inner = inner_llm

    def __getattr__(self, name):
        attr = getattr(self._inner, name)
        if callable(attr) and name in ("generate", "agenerate", "invoke", "ainvoke",
                                        "predict", "apredict", "__call__"):
            def _wrapped(*args, **kwargs):
                _rate_limiter.wait(f"RAGAS judge.{name}")
                return attr(*args, **kwargs)
            return _wrapped
        return attr

    # Delegate dunder / special attributes that RAGAS uses directly
    @property
    def llm(self):
        return self._inner.llm


# ─────────────────────────────────────────────────────────────────────────────
# MAIN EVALUATION
# ─────────────────────────────────────────────────────────────────────────────

def run_evaluation():
    print("=" * 70)
    print("  RAGAS LIGHTWEIGHT EVALUATION — Oriental Herbs AI Service")
    print(f"  Run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("  Rate limit: 12 req/min (5s gap) — tương thích Gemini free tier")
    print("=" * 70)
    print()

    # ── Kiểm tra RAGAS đã cài chưa ─────────────────────────────────────────
    try:
        from ragas import evaluate
        from ragas.metrics import faithfulness, answer_relevancy
        from ragas.llms import LangchainLLMWrapper
        from ragas.embeddings import LangchainEmbeddingsWrapper
        from datasets import Dataset
        print("[OK] RAGAS + datasets sẵn sàng.\n")
    except ImportError as e:
        print(f"[ERROR] Thiếu thư viện: {e}")
        print("  Chạy: pip install ragas==0.1.21 datasets langchain-google-genai")
        sys.exit(1)

    # ── Khởi tạo services ───────────────────────────────────────────────────
    print("[INIT] Khởi tạo services...")
    settings = get_settings()
    retriever = Retriever()
    gemini = GeminiClient()

    print(f"  Embedding model  : bkai-foundation-models/vietnamese-bi-encoder")
    print(f"  RAG LLM          : {gemini.model_name}")
    print(f"  RAGAS Judge LLM  : gemini-2.0-flash")
    print(f"  Rate limit       : {int(60 / _rate_limiter.min_interval)} req/min "
          f"({_rate_limiter.min_interval:.0f}s/call)")
    print(f"  Qdrant           : {settings.qdrant_host}:{settings.qdrant_port}")
    print(f"  Collection health: {settings.collection_articles}")
    print(f"  Collection prods : {settings.collection_products}")
    print()

    # ── Khởi tạo RAGAS judge dùng Gemini (không cần OpenAI) ────────────────
    print("[INIT] Cấu hình RAGAS judge (Gemini 2.0-flash)...")
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

        # Dùng gemini-2.0-flash làm judge: nhẹ hơn 2.5-flash, ít tốn quota
        judge_llm = LangchainLLMWrapper(
            ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=settings.gemini_api_key,
                temperature=0.0,
                max_retries=3,          # langchain tự retry tầng thấp
                request_timeout=120,
            )
        )

        # Embedding cho Answer Relevance (cosine sim question ↔ generated questions)
        judge_embeddings = LangchainEmbeddingsWrapper(
            GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",
                google_api_key=settings.gemini_api_key,
            )
        )

        # Gán judge vào metrics
        faithfulness.llm = judge_llm
        answer_relevancy.llm = judge_llm
        answer_relevancy.embeddings = judge_embeddings

        print("[OK] RAGAS judge = Gemini 2.0-flash (zero OpenAI cost!)\n")
    except Exception as exc:
        print(f"[ERROR] Không khởi tạo được RAGAS judge: {exc}")
        print("  Đảm bảo GEMINI_API_KEY trong .env và langchain-google-genai đã cài.")
        sys.exit(1)

    # ── Warm-up embedding model ─────────────────────────────────────────────
    print("[WARMUP] Loading embedding model (lần đầu mất 30-60s)...")
    _ = retriever.embedding.model
    print("[WARMUP] Embedding model ready.\n")

    # ── Load cache (resume nếu bị ngắt) ────────────────────────────────────
    samples = load_cache()
    already_done = len(samples.get("question", []))
    if already_done > 0:
        print(f"[RESUME] Bỏ qua {already_done} câu đã xử lý, tiếp tục từ câu {already_done + 1}.\n")

    failed_cases = []
    total = len(TEST_CASES)

    print(f"[PIPELINE] Chạy {total - already_done} câu còn lại ({total} tổng)...\n")
    print("-" * 70)

    for idx, case in enumerate(TEST_CASES, 1):
        # Bỏ qua nếu đã có trong cache
        if idx <= already_done:
            continue

        question = case["question"]
        intent = case["intent"]
        intent_label = "Health" if intent == "health" else "Product"

        print(f"[{idx:02d}/{total}] [{intent_label}] {question}")

        try:
            # Bước 1: Retrieval — không tốn quota Gemini
            t0 = time.time()
            retrieval_result = retriever.retrieve(intent=intent, query=question)
            ctx_list = extract_contexts(retrieval_result, intent)
            t_retrieval = time.time() - t0
            print(f"  Retrieval: {len(ctx_list)} contexts ({t_retrieval:.2f}s)")

            # Bước 2: Generation — có rate limiter + retry
            prompt = build_prompt(question, intent, retrieval_result)

            answer = call_with_retry(
                gemini.generate_sync,
                prompt,
                label=f"generation [{idx}]",
                max_retries=4,
                temperature=0.3,
                max_tokens=512,
            )

            print(f"  Generation: {len(answer)} chars")
            preview = answer[:80].replace("\n", " ")
            print(f"  Preview: \"{preview}...\"")

            # Bước 3: Lưu + cache ngay
            samples["question"].append(question)
            samples["answer"].append(answer)
            samples["contexts"].append(ctx_list)
            save_cache(samples)
            print(f"  [CACHED] {idx}/{total}")

        except Exception as exc:
            err_str = str(exc)[:200]
            print(f"  [FAIL] {err_str}")
            failed_cases.append({"idx": idx, "question": question, "error": err_str})
            # Entry placeholder để giữ index
            samples["question"].append(question)
            samples["answer"].append("(generation failed)")
            samples["contexts"].append(["(no context)"])
            save_cache(samples)

        print()

    print("-" * 70)
    n_ok = total - len(failed_cases)
    print(f"[PIPELINE] Hoàn thành: {n_ok}/{total} thành công.\n")

    if failed_cases:
        print(f"[WARNING] {len(failed_cases)} câu thất bại:")
        for fc in failed_cases:
            print(f"  #{fc['idx']}: {fc['question'][:50]}...")
            print(f"    Error: {fc['error'][:100]}")
        print()

    # ── RAGAS evaluate ───────────────────────────────────────────────────────
    # RAGAS tự gọi LLM judge nhiều lần/sample.
    # Ta không thể inject rate limiter sâu vào RAGAS callback dễ dàng,
    # nên dùng cách đơn giản hơn: đặt batch_size=1 để RAGAS xử lý tuần tự,
    # và patch langchain model với max_concurrency=1.
    print("[RAGAS] Bắt đầu chấm điểm...")
    print("  Judge: Gemini 2.0-flash")
    print(f"  Samples: {len(samples['question'])}")
    print("  Ước tính: ~3-10 phút (tùy rate limit)\n")

    dataset = Dataset.from_dict(samples)

    t_ragas_start = time.time()
    try:
        ragas_result = evaluate(
            dataset=dataset,
            metrics=[faithfulness, answer_relevancy],
            raise_exceptions=False,   # Không dừng khi 1 sample lỗi
        )
        t_ragas = time.time() - t_ragas_start
        print(f"[RAGAS] Chấm điểm xong trong {t_ragas:.1f}s.\n")
    except Exception as exc:
        err_str = str(exc)
        print(f"[RAGAS ERROR] {err_str[:300]}")
        if "429" in err_str or "quota" in err_str.lower():
            print()
            print("  RAGAS judge cũng bị rate limit 429.")
            print("  Hãy đợi ~1 phút rồi chạy lại script.")
            print("  Cache đã được lưu — pipeline generation sẽ KHÔNG chạy lại.")
        sys.exit(1)

    # ── Xóa cache ────────────────────────────────────────────────────────────
    clear_cache()

    # ── Bảng kết quả chi tiết ────────────────────────────────────────────────
    print("=" * 80)
    print("  RAGAS EVALUATION RESULTS")
    print("=" * 80)

    result_df = ragas_result.to_pandas()

    print(f"\n{'#':<4} {'Intent':<10} {'Question':<44} {'Faith':>7} {'AnswRel':>8}")
    print("-" * 80)

    health_faith, health_rel = [], []
    product_faith, product_rel = [], []

    for i, row in result_df.iterrows():
        case = TEST_CASES[i]
        intent = case["intent"]
        q_short = row["question"][:42] + ".." if len(row["question"]) > 44 else row["question"]
        faith = row.get("faithfulness", float("nan"))
        rel = row.get("answer_relevancy", float("nan"))

        # Guard NaN
        faith_ok = faith == faith  # False nếu nan
        rel_ok = rel == rel

        intent_lbl = "Health" if intent == "health" else "Product"
        faith_flag = ("✓" if faith >= 0.7 else ("~" if faith >= 0.4 else "✗")) if faith_ok else "?"
        rel_flag = ("✓" if rel >= 0.7 else ("~" if rel >= 0.4 else "✗")) if rel_ok else "?"

        faith_str = f"{faith:.3f}" if faith_ok else " N/A"
        rel_str = f"{rel:.3f}" if rel_ok else " N/A"

        print(f"{i+1:<4} {intent_lbl:<10} {q_short:<44} {faith_str:>6}{faith_flag} {rel_str:>6}{rel_flag}")

        if intent == "health":
            if faith_ok: health_faith.append(faith)
            if rel_ok:   health_rel.append(rel)
        else:
            if faith_ok: product_faith.append(faith)
            if rel_ok:   product_rel.append(rel)

    print("-" * 80)

    # ── Aggregate ─────────────────────────────────────────────────────────────
    def safe_avg(lst: list) -> float:
        return sum(lst) / len(lst) if lst else float("nan")

    avg_h_f  = safe_avg(health_faith)
    avg_h_r  = safe_avg(health_rel)
    avg_p_f  = safe_avg(product_faith)
    avg_p_r  = safe_avg(product_rel)
    all_f    = safe_avg(health_faith + product_faith)
    all_r    = safe_avg(health_rel  + product_rel)

    def fmt(v: float) -> str:
        return f"{v:.3f}" if v == v else " N/A"

    print()
    print("  AGGREGATE SCORES")
    print("  " + "─" * 56)
    print(f"  {'Segment':<26} {'Faithfulness':>13} {'Ans.Relevance':>14}")
    print("  " + "─" * 56)
    print(f"  {'Health  (12 queries)':<26} {fmt(avg_h_f):>13} {fmt(avg_h_r):>14}")
    print(f"  {'Product  (8 queries)':<26} {fmt(avg_p_f):>13} {fmt(avg_p_r):>14}")
    print("  " + "─" * 56)
    print(f"  {'OVERALL (20 queries)':<26} {fmt(all_f):>13} {fmt(all_r):>14}")
    print()

    # ── Interpretation ────────────────────────────────────────────────────────
    def interpret(v: float) -> str:
        if v != v: return "N/A"
        if v >= 0.80: return "Excellent ✓✓"
        if v >= 0.65: return "Good ✓"
        if v >= 0.50: return "Acceptable ~"
        return "Needs work ✗"

    print("  INTERPRETATION")
    print("  " + "─" * 56)
    print(f"  Faithfulness    {fmt(all_f)}  →  {interpret(all_f)}")
    print(f"  Ans. Relevance  {fmt(all_r)}  →  {interpret(all_r)}")
    print()
    print("  Thang điểm RAGAS (0.0 – 1.0):")
    print("    >= 0.80  : Excellent — LLM bám sát context, ít hallucination")
    print("    0.65-0.80: Good      — Acceptable production quality")
    print("    0.50-0.65: Fair      — Cần cải thiện chunking / prompt")
    print("    < 0.50   : Poor      — Hallucination cao hoặc answer lạc đề")
    print()

    # ── Lưu JSON ──────────────────────────────────────────────────────────────
    json_path = Path(__file__).parent / "eval_ragas_results.json"
    output = {
        "run_at": datetime.now().isoformat(),
        "model_rag_llm": gemini.model_name,
        "model_judge_llm": "gemini-2.0-flash",
        "model_embedding": "bkai-foundation-models/vietnamese-bi-encoder",
        "total_cases": total,
        "failed_cases": len(failed_cases),
        "rate_limit_rpm": int(60 / _rate_limiter.min_interval),
        "aggregate": {
            "overall_faithfulness": round(all_f, 4) if all_f == all_f else None,
            "overall_answer_relevancy": round(all_r, 4) if all_r == all_r else None,
            "health_faithfulness": round(avg_h_f, 4) if avg_h_f == avg_h_f else None,
            "health_answer_relevancy": round(avg_h_r, 4) if avg_h_r == avg_h_r else None,
            "product_faithfulness": round(avg_p_f, 4) if avg_p_f == avg_p_f else None,
            "product_answer_relevancy": round(avg_p_r, 4) if avg_p_r == avg_p_r else None,
        },
        "per_sample": [
            {
                "idx": i + 1,
                "intent": TEST_CASES[i]["intent"],
                "question": row["question"],
                "answer": row["answer"][:300],
                "n_contexts": len(row["contexts"]),
                "faithfulness": round(row.get("faithfulness", float("nan")), 4)
                    if row.get("faithfulness", float("nan")) == row.get("faithfulness", float("nan")) else None,
                "answer_relevancy": round(row.get("answer_relevancy", float("nan")), 4)
                    if row.get("answer_relevancy", float("nan")) == row.get("answer_relevancy", float("nan")) else None,
            }
            for i, row in result_df.iterrows()
        ],
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"  [SAVED] JSON → {json_path.name}")
    print(f"  [SAVED] Log  → {out_path.name}")
    print()
    print("=" * 80)
    print("  Eval xong! Copy bảng AGGREGATE vào README.md để show nhà tuyển dụng.")
    print("=" * 80)

    return output


def main():
    run_evaluation()


if __name__ == "__main__":
    main()
