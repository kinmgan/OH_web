"""
Crawler cho dongphuongyphap.net
(Version 2.1 - da dieu chinh theo cau truc that)

Phat hien thuc te:
- Trang /dinh-duong chua div.list-specialcat-details > div.item[id]
- Moi div.item hien thi 2-27 bai viet o dang /dinh-duong/<slug>/ (dinh duong)
- Trang /chuyen-mon/<id> hien thi bai viet o dang /benh-dieu-tri/<slug>/ (benh)
- Selector content bai viet: div.entry-content (chinh xac, on dinh)
- KHONG co pagination /page/N/ o trang chinh
- KHONG co sitemap.xml
- De crawl NHIEU bai:
  + Liet ke tat ca div.item tren /dinh-duong (~30-50 bai dinh duong)
  + Liet ke tu /chuyen-mon/<id> (~200+ bai benh) neu can
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


class DongPhuongYPhapCrawler:
    BASE_URL = "https://dongphuongyphap.net"
    # Trang nguon chinh: trang dinh duong (gom cac category con)
    CATEGORY_URL = "https://dongphuongyphap.net/dinh-duong"
    DELAY = 1.0  # giay giua cac request
    # OUTPUT_DIR dat canh file crawler (khong phu thuoc cwd)
    OUTPUT_DIR = Path(__file__).parent / "output" / "dongphuongyphap"

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    }

    def __init__(self, max_articles: int = 50, include_benh: bool = True):
        """
        Args:
            max_articles: Gioi han tong so bai crawl.
            include_benh: Co quet bai tu /chuyen-mon/<id> (benh) khong?
                          Mac dinh True vi nguon benh rat giau.
        """
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.max_articles = max_articles
        self.include_benh = include_benh
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

    def discover_categories(self) -> list[dict]:
        """
        Phase 1: Tim cac category tu trang /dinh-duong.
        Moi div.item co id la slug category.
        """
        print(f"\n[Phase 1] Discover categories tu {self.CATEGORY_URL}")
        soup = self._fetch(self.CATEGORY_URL)
        if not soup:
            return []

        container = soup.find("div", class_="list-specialcat-details")
        if not container:
            print("  [LOI] Khong tim thay div.list-specialcat-details")
            return []

        categories = []
        items = container.find_all("div", class_="item", recursive=False)
        print(f"  Tim thay {len(items)} category trong /dinh-duong")

        for item in items:
            cat_id = item.get("id", "")
            # Tien de: link dau tien trong item
            first_link = item.find("a", href=True)
            title = first_link.get_text(strip=True) if first_link else cat_id

            if cat_id:
                categories.append({
                    "id": cat_id,
                    "title": title,
                    "list_url": f"{self.BASE_URL}/chuyen-mon/{cat_id}",
                })
                print(f"  - {cat_id}: {title}")

        return categories

    def discover_articles(self) -> tuple[list[dict], int]:
        """
        Phase 2: Lay link bai viet tu:
        (1) div.item trong /dinh-duong (cac bai /dinh-duong/<slug> truc tiep)
        (2) Trang /chuyen-mon/<id> (cac bai /benh-dieu-tri/<slug>) neu include_benh

        Returns:
            (all_articles, skipped_count) - skipped_count la so URL da crawl truoc do
        """
        print(f"\n[Phase 2] Discover articles (include_benh={self.include_benh})")
        all_articles = []
        seen_urls = set()
        skipped = 0

        categories = self.discover_categories()

        # ---- (1) Lay link bai viet /dinh-duong/<slug> tu trang /dinh-duong ----
        print(f"\n  [2a] Lay link /dinh-duong/<slug> tu trang /dinh-duong")
        soup = self._fetch(self.CATEGORY_URL)
        if soup:
            container = soup.find("div", class_="list-specialcat-details")
            if container:
                for item in container.find_all("div", class_="item", recursive=False):
                    cat_id = item.get("id", "")
                    first_link = item.find("a", href=True)
                    cat_title = first_link.get_text(strip=True) if first_link else cat_id

                    # Lay tat ca link bai viet /dinh-duong/<slug> trong item nay
                    for a in item.find_all("a", href=True):
                        href = a["href"]
                        text = a.get_text(strip=True)
                        # Pattern: /dinh-duong/<slug> (co the co / o cuoi)
                        m = re.match(r".*/dinh-duong/([^/]+)/?$", href)
                        if m and text and len(text) > 10:
                            full_url = urljoin(self.BASE_URL, href)
                            if full_url in seen_urls:
                                continue
                            seen_urls.add(full_url)
                            # Skip neu da crawl truoc do
                            if full_url in self.crawled_urls:
                                skipped += 1
                                continue
                            all_articles.append({
                                "title": text,
                                "url": full_url,
                                "category_id": cat_id,
                                "category_title": cat_title,
                                "source_section": "dinh-duong",
                            })

        print(f"    -> Tim duoc {len(all_articles)} bai moi tu /dinh-duong (skipped: {skipped})")

        # ---- (2) Lay link bai viet /benh-dieu-tri/<slug> tu /chuyen-mon/<id> ----
        if self.include_benh and len(all_articles) < self.max_articles:
            print(f"\n  [2b] Lay link /benh-dieu-tri/<slug> tu /chuyen-mon/<id>")
            for cat in categories:
                if len(all_articles) >= self.max_articles:
                    break
                soup = self._fetch(cat["list_url"])
                if not soup:
                    continue
                count = 0
                for a in soup.find_all("a", href=True):
                    href = a["href"]
                    text = a.get_text(strip=True)
                    # Pattern: /benh-dieu-tri/<slug> (la bai viet benh)
                    m = re.match(r".*/benh-dieu-tri/([^/]+)/?$", href)
                    if m and text and len(text) > 10:
                        full_url = urljoin(self.BASE_URL, href)
                        if full_url in seen_urls:
                            continue
                        seen_urls.add(full_url)
                        # Skip neu da crawl truoc do
                        if full_url in self.crawled_urls:
                            skipped += 1
                            continue
                        all_articles.append({
                            "title": text,
                            "url": full_url,
                            "category_id": cat["id"],
                            "category_title": cat["title"],
                            "source_section": "benh-dieu-tri",
                        })
                        count += 1
                print(f"    - {cat['id']}: +{count} bai moi (tong: {len(all_articles)})")

        all_articles = all_articles[:self.max_articles]
        print(f"\n  TONG: {len(all_articles)} bai viet moi (skipped: {skipped})")
        return all_articles, skipped

    def extract_article(self, soup: BeautifulSoup, url: str) -> dict | None:
        """Trich xuat noi dung bai viet."""
        title_tag = soup.find("h1")
        title = title_tag.get_text(strip=True) if title_tag else "Unknown"

        # Selector chinh xac: div.entry-content
        content_div = soup.find("div", class_="entry-content")
        if not content_div:
            content_div = soup.find("div", class_="entry")
        if not content_div:
            return None

        markdown_content = md(
            str(content_div),
            heading_style="ATX",
            strip=["img", "script", "style"],
        )
        markdown_content = self._clean_markdown(markdown_content)

        return {
            "title": title,
            "url": url,
            "content": markdown_content,
            "crawled_at": datetime.now().isoformat(),
        }

    def _clean_markdown(self, text: str) -> str:
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"\[([^\]]*)\]\(\s*\)", r"\1", text)
        text = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", text)
        text = re.sub(r"[ \t]+$", "", text, flags=re.MULTILINE)
        return text.strip()

    def _safe_filename(self, name: str) -> str:
        safe = name.strip()
        safe = re.sub(r'[\\/:*?"<>|]', "", safe)
        safe = re.sub(r"\s+", " ", safe).strip()
        safe = re.sub(r" ", "-", safe)
        return safe[:60] or "article"

    def _save_article(self, article: dict, section: str, index: int) -> Path:
        section_dir = self.OUTPUT_DIR / self._safe_filename(section)
        section_dir.mkdir(exist_ok=True)
        safe_title = self._safe_filename(article["title"])
        filename = f"{index:03d}_{safe_title}.md"
        filepath = section_dir / filename

        frontmatter = f"""---
title: "{article['title']}"
source: "{article['url']}"
section: "{section}"
crawled_at: "{article['crawled_at']}"
---

"""
        (frontmatter + article["content"]).encode("utf-8")
        filepath.write_text(frontmatter + article["content"], encoding="utf-8")
        return filepath

    def crawl_article(self, url: str) -> dict | None:
        soup = self._fetch(url)
        if not soup:
            return None
        return self.extract_article(soup, url)

    def run(self):
        print("=" * 70)
        print("DONG PHUONG Y PHAP CRAWLER (v2.2 - co skip)")
        print("=" * 70)

        result = self.discover_articles()
        all_articles, skipped_in_discover = result
        if not all_articles:
            print("[LOI] Khong tim duoc bai viet nao")
            return 0

        print(f"\n{'='*70}")
        print(f"BAT DAU CRAWL {len(all_articles)} BAI VIET MOI")
        print(f"Da skip {skipped_in_discover} bai (da crawl truoc do)")
        print(f"{'='*70}")

        # Dem theo section
        section_count = {}
        saved_count = 0
        saved_files = []

        for i, link in enumerate(all_articles, 1):
            section = link["source_section"]
            section_count.setdefault(section, 0)
            section_count[section] += 1
            idx = section_count[section]

            print(f"\n[{i}/{len(all_articles)}] {link['title'][:60]}")
            print(f"  URL: {link['url']}")
            print(f"  Section: {section}, Category: {link['category_title']}")

            article = self.crawl_article(link["url"])
            if article:
                filepath = self._save_article(article, section, idx)
                print(f"  [OK] Saved: {filepath.relative_to(self.OUTPUT_DIR)}")
                saved_files.append({
                    "title": article["title"],
                    "url": link["url"],
                    "section": section,
                    "category_id": link["category_id"],
                    "file": str(filepath.relative_to(self.OUTPUT_DIR)),
                })
                # Danh dau URL nay da crawl (de lan sau skip)
                self._save_crawled_url(link["url"])
                saved_count += 1
            else:
                print(f"  [FAIL] Khong trich xuat duoc noi dung")

        # Merge voi index.json cu (giu lai bai cu + them bai moi)
        old_index_path = self.OUTPUT_DIR / "index.json"
        old_articles = []
        if old_index_path.exists():
            try:
                with open(old_index_path, "r", encoding="utf-8") as f:
                    old_data = json.load(f)
                old_articles = old_data.get("articles", [])
            except (json.JSONDecodeError, OSError):
                pass

        # Merge: giu article cu (neu URL van co trong self.crawled_urls), them article moi
        existing_urls = {a["url"] for a in saved_files}
        merged_articles = list(saved_files)
        for old in old_articles:
            if old.get("url") not in existing_urls:
                merged_articles.append(old)

        # Luu index
        index = {
            "source": "dongphuongyphap.net",
            "total_found_this_run": len(all_articles),
            "saved_articles_this_run": saved_count,
            "skipped_already_crawled": skipped_in_discover,
            "total_articles_in_index": len(merged_articles),
            "by_section_this_run": section_count,
            "crawled_at": datetime.now().isoformat(),
            "articles": merged_articles,
        }
        index_path = self.OUTPUT_DIR / "index.json"
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, indent=2)

        print(f"\n{'='*70}")
        print(f"[HOAN THANH RUN NAY] {saved_count}/{len(all_articles)} bai moi da luu")
        print(f"[TONG CONG] {len(merged_articles)} bai trong index.json")
        print(f"Theo section (run nay): {section_count}")
        print(f"Output: {self.OUTPUT_DIR}")
        print(f"{'='*70}")
        return saved_count


if __name__ == "__main__":
    import sys

    max_articles = 50
    include_benh = True

    if len(sys.argv) > 1:
        max_articles = int(sys.argv[1])
    if len(sys.argv) > 2:
        include_benh = sys.argv[2].lower() == "true"

    crawler = DongPhuongYPhapCrawler(
        max_articles=max_articles,
        include_benh=include_benh,
    )
    crawler.run()
