# Oriental Herbs — RAG Chatbot & E-Commerce Platform

Nền tảng thương mại điện tử dược liệu Đông y tích hợp **AI Service độc lập** — chatbot tư vấn theo kiến trúc Retrieval-Augmented Generation (RAG), phân luồng 3 intent và tối ưu cho corpus tiếng Việt chuyên ngành.

---

## 🤖 AI Service — RAG Chatbot

### Kiến trúc tổng thể

```
┌──────────────┐    HTTPS + JWT     ┌──────────────────┐   internal (docker)   ┌────────────────────┐
│  Frontend    │ ─────────────────► │  Java Spring BE  │ ────────────────────► │  AI Service        │
│  (Next.js)   │                    │  (Port 8080)     │   X-Internal-Token    │  (FastAPI :8000)   │
└──────────────┘                    └────────┬─────────┘                       └──────────┬─────────┘
                                             │ JDBC                                       │
                                             ▼                                            ▼
                                       ┌──────────┐                               ┌──────────────┐
                                       │PostgreSQL│                               │  Qdrant :6333│
                                       └──────────┘                               └──────────────┘
```

AI Service chạy độc lập hoàn toàn với Java BE — tách biệt tài nguyên, không public ra ngoài, chỉ giao tiếp qua internal secret token.

---

### Luồng RAG end-to-end

```
User message
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Intent Router (Semantic Router)                              │
│     ├─ Keyword scoring có trọng số (length-weighted)            │
│     ├─ Nếu tie → LLM tie-break (1 call, temperature=0)          │
│     └─ Output: health | shopping                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
     [health]                        [shopping]
          │                               │
┌──────────────┐  ┌──────────────┐
│ Query expand │  │ Budget/cate  │
│ (lay↔formal) │  │ extract(regex│
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Qdrant vec   │  │ Qdrant vec   │
│ search top-20│  │ search top-30│
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Hybrid       │  │ Python-side  │
│ Rerank       │  │ filter       │
│ (vec+BM25    │  │ (price/stock)│
│  +title)     │  │ + Rerank     │
└──────┬───────┘  └──────┬───────┘
       │ top-3           │ top-5
       ▼                 ▼
┌─────────────────────────────────┐
│  Generation (LLM)               │
│  + System prompt per-intent     │
│  + Guardrails                   │
│  + Conversation memory          │
└─────────────────────────────────┘
       │
       ▼
  JSON / SSE stream + citations
```

---

### Data Ingestion Pipelines

#### Pipeline 1 — Y khoa (Unstructured)

**Crawling** — 2 nguồn có cấu trúc HTML khác nhau hoàn toàn:

| Source | Phương pháp discovery | Delay |
|---|---|---|
| `dongphuongyphap.net` | Reverse-engineer DOM: `div.list-specialcat-details` → category slugs → bài viết | 1s/request |
| `thaythuocvietnam.vn` | Parse `post-sitemap.xml`, filter URL theo keyword (`duoc-lieu`, `thao-duoc`, `benh-`) | 2s/request |

Cả hai crawler đều có: idempotent skip (load `index.json` để bỏ qua URL đã crawl), encoding fix (`resp.encoding = "utf-8"` bắt buộc — batch đầu bị lỗi font toàn bộ), output dạng `.md` với YAML frontmatter.

**Chunking & Embedding:**
```
.md files
   │
   ▼
Parse YAML frontmatter
   │
   ▼
Split by ## H2 heading          ← giữ ngữ cảnh y khoa theo section
   │
   ├─ section ≤ 2200 chars → giữ nguyên
   └─ section > 2200 chars → split tại \n\n, overlap=200 chars
   │
   ▼
Clean Markdown noise            ← strip ![img], **bold**, HTML tags, URLs
   │
   ▼
Build search text:
  article_title × 3             ← title repetition boost cho bi-encoder
  section_title × 2
  content_clean
   │
   ▼
Embed: bkai-foundation-models/vietnamese-bi-encoder (768d)
   │
   ▼
Upsert Qdrant collection: health_articles
Payload: {article_title, section_title, content, url, source, chunk_index, ...}
```

#### Pipeline 2 — Sản phẩm (Structured)

```
PostgreSQL (JOIN products + categories + product_variants)
   │
   ▼
Build embedding text:
  "{name} - {description} - Danh mục: {category_name} - Tags: {tags}"
   │
   ├─ Normalize TCM tags → user-facing terms (TCM synonym map, 90+ entries)
   └─ Query-side expansion: "bổ khí" ↔ "bồi bổ cơ thể, tăng sức đề kháng"
   │
   ▼
Embed: bkai vietnamese-bi-encoder, batch_size=32
   │
   ▼
Upsert Qdrant collection: products
Payload: {product_id, name, min_price, category_id, total_stock, tags, ...}
```

---

### Retrieval Strategy

| Intent | Vector | Filter | Rerank | Final |
|---|---|---|---|---|
| **Health** | top-20, `health_articles` | — | Hybrid: vec×0.65 + BM25-lite×0.20 + title×0.15 | top-3 |
| **Shopping** | top-30, `products` | price ≤ budget, stock > 0, category_id match | Hybrid: vec×0.60 + BM25-lite×0.25 + title×0.15 | top-5 |

**BM25-lite**: tự implement (Jaccard + BM25 smoothing), không dùng cross-encoder ngoại ngữ.

---

### Key Engineering Decisions

| Vấn đề | Quyết định |
|---|---|
| Cross-encoder `ms-marco-MiniLM-L-6-v2` chỉ hiểu tiếng Anh | Bỏ — thay bằng custom hybrid reranker |
| TCM vocab gap: DB dùng thuật ngữ Đông y, user dùng từ thông thường | TCM synonym map (90+ entries, evidence-driven từ 1325 tag occurrences) + query expansion |
| Guardrails y tế | System prompt ép từ chối chẩn đoán/kê đơn; pre-LLM regex pattern detect đơn thuốc |
| AI Service không public | Internal token (`X-Internal-Token`), chỉ Java BE gọi được |
| Conversation memory | In-memory buffer per `session_id`, tự cắt khi > 20 messages |

---

### Tech Stack — AI Service

| Layer | Công nghệ |
|---|---|
| Web framework | FastAPI + Uvicorn |
| Vector DB | Qdrant (Docker) |
| Embedding | `bkai-foundation-models/vietnamese-bi-encoder` via Sentence-Transformers |
| LLM | Google Generative AI API |
| Reranking | Custom BM25-lite + title boost |
| Crawling | Requests + BeautifulSoup4 + Markdownify |
| DB connector | psycopg3 (binary) |
| Eval | RAGAS-inspired (Faithfulness + Answer Relevance) |

---

## 🛒 E-Commerce Platform

### Tech Stack

| Layer | Công nghệ |
|---|---|
| Backend | Java 17, Spring Boot (JPA, Security, Web) |
| Database | PostgreSQL |
| Auth | JWT + OAuth2 (Google Login) |
| Storage | Cloudinary |
| Frontend | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |

### Nghiệp vụ chính

- Quản lý sản phẩm & danh mục (multi-variant)
- Giỏ hàng, checkout, shipping estimation
- Tích hợp thanh toán
- Quản lý đơn hàng & hoàn/trả hàng
- Đánh giá sản phẩm (reviews + rating)
- Dynamic homepage (admin kéo thả sections)
- Chiến dịch marketing & coupon
- User radar chart (phân tích sức khỏe khách hàng)

---

## 🐳 Chạy với Docker

```bash
docker-compose up --build -d
```

| Service | URL |
|---|---|
| Backend (Spring Boot) | `http://localhost:8080` |
| Frontend User | `http://localhost:3000` |
| Frontend Admin | `http://localhost:3001` |
| AI Service (FastAPI) | `http://localhost:8000` (internal only) |
| Qdrant | `http://localhost:6333` |

**Cần cấu hình `.env`** cho mỗi service — xem `.env.example` trong từng thư mục.

### Chạy AI Service riêng

```bash
cd ai_service
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

---

## ⚙️ Local Development

**Yêu cầu**: Java 17, Node.js ≥ 18, PostgreSQL, Python ≥ 3.11, Docker (cho Qdrant).

```bash
# Backend
cd BE && cp .env.example .env
./gradlew bootRun        # Windows: gradlew.bat bootRun

# Frontend User
cd fe && npm install && npm run dev          # http://localhost:3000

# Frontend Admin
cd fe-admin && npm install && npm run dev    # http://localhost:3001

# AI Service
cd ai_service
uvicorn src.main:app --reload --port 8000
```
