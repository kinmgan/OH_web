"""
Crawler cho thaythuocvietnam.vn
(Version 2 - da dieu chinh theo cau truc that)

Phat hien thuc te:
- URL goc /duoc-lieu/ chi la 1 WordPress page (redirect ve bai 'Cau ky tu')
- KHONG phai category chua nhieu bai viet
- De lay BAI VIET, can dung post-sitemap.xml (357 bai tong cong)
- Loc bai theo tu khoa: 'duoc-lieu', 'thao-duoc', 'vi-thuoc', 'cay-thuoc', 'thuoc-nam', 'thuoc', 'benh-'
- Cung co the quet category /thu-vien/thuoc-biet-duoc/ neu can

Selector content bai viet: thu nhieu selector, uu tien div.entry-content
"""
import time
import re
import json
from pathlib import Path
from urllib.parse import urljoin
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md


# Cac tu khoa can loc de chi lay bai ve duoc lieu / thao duoc
HERB_KEYWORDS = [
    "duoc-lieu",      # duoc lieu
    "thao-duoc",      # thao duoc
    "vi-thuoc",       # vi thuoc
    "cay-thuoc",      # cay thuoc
    "thuoc-nam",      # thuoc nam
    "thuoc",          # chung chung ve thuoc
    "duoc-thao",
    "cay",            # cac bai ve cay thuoc
    "benh",           # cac bai ve benh
    "tri-",           # dieu tri
]


class ThayThuocVietNamCrawler:
    BASE_URL = "https://thaythuocvietnam.vn"
    CATEGORY_URL = "https://thaythuocvietnam.vn/duoc-lieu/"
    POST_SITEMAP_URL = "https://thaythuocvietnam.vn/post-sitemap.xml"
    DELAY = 2.0  # giay - cham hon vi co canh bao ban quyen
    OUTPUT_DIR = Path("data_ingestion/crawlers/output/thaythuocvietnam")

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    }

    def __init__(self, max_articles: int = 50, keyword_filter: bool = True):
        """
        Args:
            max_articles: Gioi han so bai toi da crawl.
            keyword_filter: Chi loc bai co chua tu khoa duoc lieu (True)
                            hoac lay tat ca (False).
        """
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)
        # OUTPUT_DIR dat canh file crawler (khong phu thuoc cwd)
        self.OUTPUT_DIR = Path(__file__).parent / "output" / "thaythuocvietnam"
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.max_articles = max_articles
        self.keyword_filter = keyword_filter
        # Load danh sach URL da crawl tu index.json (neu co) de skip
        self.crawled_urls: set[str] = self._load_crawled_urls()
        if self.crawled_urls:
            print(f"[Init] Da crawl truoc do: {len(self.crawled_urls)} bai (se skip)")

    def _load_crawled_urls(self) -> set[str]:
        """Load cac URL da crawl tu index.json (neu co)."""
        index_path = self.OUTPUT_DIR / "index.json"
        if not index_path.exists():
            return set()
        try:
            with open(index_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {a["url"] for a in data.get("articles", []) if "url" in a}
        except (json.JSONDecodeError, KeyError, OSError) as e:
            print(f"[Init] Khong doc duoc index.json cu: {e}")
            return set()

    def _save_crawled_url(self, url: str) -> None:
        """Luu URL da crawl vao set trong bo nho (se ghi ra index.json cuoi run)."""
        self.crawled_urls.add(url)

    def _fetch(self, url: str) -> BeautifulSoup | None:
        """Fetch URL va tra ve BeautifulSoup."""
        time.sleep(self.DELAY)
        try:
            resp = self.session.get(url, timeout=15)
            resp.raise_for_status()
            return BeautifulSoup(resp.text, "html.parser")
        except requests.RequestException as e:
            print(f"  [LOI] Fetch {url}: {e}")
            return None

    def _fetch_xml(self, url: str) -> str | None:
        """Fetch noi dung XML (khong dung delay qua nhieu)."""
        time.sleep(self.DELAY)
        try:
            resp = self.session.get(url, timeout=20)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as e:
            print(f"  [LOI] Fetch XML {url}: {e}")
            return None

    def discover_urls_from_sitemap(self) -> list[dict]:
        """
        Phase 1: Lay URL bai viet tu post-sitemap.xml.
        Day la CACH TOT NHAT de lay tat ca bai viet cua WordPress site.
        """
        print(f"\n[Phase 1] Lay URL tu {self.POST_SITEMAP_URL}")
        xml_content = self._fetch_xml(self.POST_SITEMAP_URL)
        if not xml_content:
            return []

        # Parse XML
        import xml.etree.ElementTree as ET
        try:
            root = ET.fromstring(xml_content.encode("utf-8"))
        except ET.ParseError as e:
            print(f"  [LOI] Parse XML: {e}")
            return []

        ns = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        all_urls = [loc.text for loc in root.findall(".//ns:loc", ns)]
        print(f"  Tong URL trong sitemap: {len(all_urls)}")

        # Loc URL theo tu khoa
        if self.keyword_filter:
            filtered = []
            for url in all_urls:
                url_lower = url.lower()
                if any(kw in url_lower for kw in HERB_KEYWORDS):
                    filtered.append(url)
            print(f"  URL sau khi loc tu khoa: {len(filtered)}")
        else:
            filtered = all_urls
            print(f"  Khong loc: {len(filtered)} URL")

        # Chuyen thanh dict, skip URL da crawl truoc do
        articles = []
        skipped = 0
        for url in filtered:
            if url in self.crawled_urls:
                skipped += 1
                continue
            if len(articles) >= self.max_articles:
                break
            slug = url.rstrip("/").split("/")[-1]
            # Loai bo .xml neu co
            slug = re.sub(r"\.xml$", "", slug)
            articles.append({
                "url": url,
                "title_slug": slug,
            })
        if skipped:
            print(f"  Skip {skipped} URL da crawl truoc do")

        return articles

    def discover_urls_from_category(self) -> list[dict]:
        """
        Phase 1 (cach 2): Neu post-sitemap khong du, quet category page.
        Vi /duoc-lieu/ chi la 1 page, nen can quet cac category khac.
        """
        # Cac category pho bien cua thaythuocvietnam
        category_urls = [
            "https://thaythuocvietnam.vn/thuvien/thuoc-biet-duoc/",
            "https://thaythuocvietnam.vn/benh-thuong-gap/",
            "https://thaythuocvietnam.vn/thuvien/y-hoc-co-so/",
            "https://thaythuocvietnam.vn/thuvien/y-hoc-lam-sang/",
            "https://thaythuocvietnam.vn/thuvien/thong-tin-huu-ich/",
        ]

        all_urls = []
        seen = set()

        for cat_url in category_urls:
            print(f"  Quet category: {cat_url}")
            soup = self._fetch(cat_url)
            if not soup:
                continue
            links = soup.find_all("a", href=True)
            for link in links:
                href = link.get("href", "")
                if not href:
                    continue
                full_url = urljoin(self.BASE_URL, href)
                if full_url in seen:
                    continue
                # Chi lay link bai viet (slug dang chu-thuong)
                if re.search(r"thaythuocvietnam\.vn/[\w\-]+/$", full_url):
                    # Loai bo cac page khong phai bai viet
                    skip_patterns = [
                        "thuvien", "thu-vien", "lien-he", "gioi-thieu",
                        "chinh-sach", "dieu-khoan", "lien-he", "trang",
                        "page", "video", "cau-hoi", "bac-si", "phong-kham",
                    ]
                    if any(p in full_url for p in skip_patterns):
                        continue
                    # Skip URL da crawl truoc do
                    if full_url in self.crawled_urls:
                        continue
                    seen.add(full_url)
                    slug = full_url.rstrip("/").split("/")[-1]
                    all_urls.append({"url": full_url, "title_slug": slug})

            if len(all_urls) >= self.max_articles:
                break

        print(f"  Tong URL moi tu category: {len(all_urls)}")
        return all_urls[:self.max_articles]

    def extract_article(self, soup: BeautifulSoup, url: str) -> dict | None:
        """
        Trich xuat noi dung bai viet.
        Thu cac selector pho bien cua WordPress.
        """
        # Tieu de
        title_tag = soup.find("h1")
        title = title_tag.get_text(strip=True) if title_tag else "Unknown"

        # Noi dung - thu nhieu selector WordPress
        content_div = (
            soup.find("div", class_="entry-content") or
            soup.find("article") or
            soup.find("div", class_=re.compile(r"post-content|content-post|content|main-content", re.I)) or
            soup.find("main")
        )

        if not content_div:
            print(f"    [CANH BAO] Khong tim thay content div")
            return None

        # Chuyen sang markdown
        markdown_content = md(
            str(content_div),
            heading_style="ATX",
            strip=["img", "script", "style", "nav", "header", "footer", "aside", "form"],
        )

        # Lam sach
        markdown_content = self._clean_markdown(markdown_content)

        # Trich xuat TOC tu heading
        toc = self._extract_toc(markdown_content)

        return {
            "title": title,
            "url": url,
            "content": markdown_content,
            "toc": toc,
            "crawled_at": datetime.now().isoformat(),
        }

    def _clean_markdown(self, text: str) -> str:
        """Lam sach markdown output."""
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"\[([^\]]*)\]\(\s*\)", r"\1", text)
        text = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", text)
        text = re.sub(r"[ \t]+$", "", text, flags=re.MULTILINE)
        # Xoa "Nguon Noi khoa Viet Nam" o cuoi
        text = re.sub(r"Ngu[ôo]n N[ộo]i khoa Vi[ệe]t Nam.*$", "", text, flags=re.IGNORECASE | re.DOTALL)
        return text.strip()

    def _extract_toc(self, text: str) -> list[str]:
        """Trich xuat table of contents tu heading."""
        headings = re.findall(r"^#{1,3}\s+(.+)$", text, re.MULTILINE)
        return headings[:20]

    def _safe_filename(self, name: str) -> str:
        """Chuyen ten thanh ten file an toan."""
        import unicodedata
        normalized = unicodedata.normalize("NFKD", name)
        ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
        safe = re.sub(r"[^\w\s-]", "", ascii_name).strip()
        safe = re.sub(r"[-\s]+", "-", safe)
        return safe[:50] or "article"

    def _save_article(self, article: dict, index: int) -> Path:
        """Luu bai viet thanh file .md."""
        safe_title = article["title"].replace('"', '\\"')
        safe_url = article["url"].replace('"', '\\"')
        safe_toc = json.dumps(article.get("toc", []), ensure_ascii=False)
        safe_title = self._safe_filename(safe_title)
        filename = f"{index:03d}_{safe_title}.md"
        filepath = self.OUTPUT_DIR / filename

        frontmatter = f"""---
title: "{safe_title}"
source: "{safe_url}"
category: "Duoc lieu"
toc: {safe_toc}
crawled_at: "{article['crawled_at']}"
---

"""
        full_content = frontmatter + article["content"]
        filepath.write_text(full_content, encoding="utf-8")
        return filepath

    def crawl_article(self, url: str) -> dict | None:
        """Crawl 1 bai viet."""
        soup = self._fetch(url)
        if not soup:
            return None
        return self.extract_article(soup, url)

    def run(self):
        """Chay crawler chinh."""
        print("=" * 70)
        print("THAY THUOC VIET NAM CRAWLER (v2.2 - co skip)")
        print("=" * 70)

        # Phase 1: Lay URL tu sitemap (cach chinh)
        articles = self.discover_urls_from_sitemap()

        # Fallback: Neu sitemap khong du, quet category
        if len(articles) < self.max_articles // 2:
            print("\n[Phase 1 fallback] Quet them tu category page...")
            more_articles = self.discover_urls_from_category()
            existing_urls = {a["url"] for a in articles}
            for a in more_articles:
                if a["url"] not in existing_urls:
                    articles.append(a)
                    if len(articles) >= self.max_articles:
                        break

        if not articles:
            print("[LOI] Khong tim duoc URL nao (hoac da crawl het)")
            return 0

        articles = articles[:self.max_articles]
        print(f"\n{'='*70}")
        print(f"TONG CONG: {len(articles)} bai viet MOI se crawl")
        print(f"{'='*70}")

        # Phase 2: Crawl tung bai
        saved_count = 0
        saved_files = []

        for i, link in enumerate(articles, 1):
            url = link["url"]
            print(f"\n[{i}/{len(articles)}] {url}")

            article = self.crawl_article(url)
            if article:
                filepath = self._save_article(article, i)
                print(f"  [OK] {article['title'][:60]}")
                print(f"  Saved: {filepath.name}")
                saved_files.append({
                    "title": article["title"],
                    "url": url,
                    "file": str(filepath.name),
                })
                # Danh dau URL nay da crawl (de lan sau skip)
                self._save_crawled_url(url)
                saved_count += 1
            else:
                print(f"  [FAIL] Khong trich xuat duoc noi dung")

        # Merge voi index.json cu
        old_index_path = self.OUTPUT_DIR / "index.json"
        old_articles = []
        if old_index_path.exists():
            try:
                with open(old_index_path, "r", encoding="utf-8") as f:
                    old_data = json.load(f)
                old_articles = old_data.get("articles", [])
            except (json.JSONDecodeError, OSError):
                pass

        existing_urls = {a["url"] for a in saved_files}
        merged_articles = list(saved_files)
        for old in old_articles:
            if old.get("url") not in existing_urls:
                merged_articles.append(old)

        # Luu index
        index = {
            "source": "thaythuocvietnam.vn",
            "total_found_this_run": len(articles),
            "saved_articles_this_run": saved_count,
            "total_articles_in_index": len(merged_articles),
            "keyword_filter": self.keyword_filter,
            "crawled_at": datetime.now().isoformat(),
            "articles": merged_articles,
        }
        index_path = self.OUTPUT_DIR / "index.json"
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, indent=2)

        print(f"\n{'='*70}")
        print(f"[HOAN THANH RUN NAY] {saved_count}/{len(articles)} bai moi da luu")
        print(f"[TONG CONG] {len(merged_articles)} bai trong index.json")
        print(f"Output: {self.OUTPUT_DIR}")
        print(f"{'='*70}")
        return saved_count


if __name__ == "__main__":
    import sys

    max_articles = 50
    keyword_filter = True

    if len(sys.argv) > 1:
        max_articles = int(sys.argv[1])
    if len(sys.argv) > 2:
        keyword_filter = sys.argv[2].lower() == "true"

    crawler = ThayThuocVietNamCrawler(
        max_articles=max_articles,
        keyword_filter=keyword_filter,
    )
    crawler.run()
