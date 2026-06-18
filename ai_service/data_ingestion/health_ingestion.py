"""Health article ingestion — parse MD files and produce semantic chunks."""
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import re

import yaml


@dataclass
class Chunk:
    """A single semantic chunk from a health article."""
    article_title: str
    section_title: str
    content: str
    source: str
    section: str
    chunk_index: int
    total_chunks: int
    file_path: str

    def build_search_text(self) -> str:
        """Full text used for embedding + keyword retrieval.

        Layout (designed to weight article + section title heavier for short queries):
          [article_title] × 2  |  [section_title] × 2  |  [cleaned_content]
        Title repetition helps cosine similarity for short queries like "đau vai gáy".
        Markdown noise (links, images, bold) is stripped to keep semantic signal clean.
        """
        content_clean = _clean_markdown_noise(self.content)
        # Repeat titles for higher weight (cheap trick that works well for bi-encoders)
        parts: list[str] = []
        if self.article_title.strip():
            parts.append(self.article_title.strip())
            parts.append(self.article_title.strip())  # × 2
            parts.append(self.article_title.strip())  # × 3 — heavier weight for short queries
        if self.section_title.strip():
            parts.append(self.section_title.strip())
            parts.append(self.section_title.strip())  # × 2
        parts.append(content_clean)
        return " | ".join(parts)

    def to_payload(self) -> dict:
        """Payload stored alongside the vector in Qdrant."""
        return {
            "article_title": self.article_title,
            "section_title": self.section_title,
            "content": self.content,
            "source": self.source,
            "section": self.section,
            "chunk_index": self.chunk_index,
            "total_chunks": self.total_chunks,
            "file_path": self.file_path,
        }


def _clean_markdown_noise(text: str) -> str:
    """Strip markdown formatting noise that hurts embedding quality.

    Removes:
      - image syntax ![alt](url)
      - inline link syntax [text](url) → keep `text`
      - bold/italic markers (**, *, __, _)
      - heading hashes when already inside the body (heading line itself stays)
      - HTML tags <...>
      - code backticks
      - standalone URLs
    Keeps semantic words intact.
    """
    # images: ![alt](url) → remove
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", text)
    # inline links: [text](url) → text
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", text)
    # bold/italic
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"__(.+?)__", r"\1", text)
    text = re.sub(r"_(.+?)_", r"\1", text)
    # html tags
    text = re.sub(r"<[^>]+>", "", text)
    # code backticks
    text = re.sub(r"`([^`]+)`", r"\1", text)
    # standalone urls (rare in crawled content but possible)
    text = re.sub(r"https?://\S+", "", text)

    # collapse multiple blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _strip_frontmatter(raw: str) -> tuple[dict, str]:
    """Split YAML frontmatter from markdown body."""
    if raw.startswith("---"):
        end = raw.index("---", 3)
        fm_raw = raw[3:end].strip()
        body = raw[end + 3:].lstrip("\n")
        try:
            meta = yaml.safe_load(fm_raw) or {}
        except Exception:
            meta = {}
        return meta, body
    return {}, raw


def _is_index_page(body: str, meta: dict) -> bool:
    """Detect link-collection/index pages with no real body content."""
    lines = [l.strip() for l in body.splitlines() if l.strip()]
    content_lines = [
        l for l in lines
        if not l.startswith("#") and not l.startswith("---")
        and not l.startswith("*") and not l.startswith("- ")
        and not l.startswith(">") and not l.startswith("_")
        and not l.startswith("|") and "Trang" not in l
        and not l.startswith("1.") and not l.startswith("2.")
    ]
    if not content_lines:
        return True
    total_chars = sum(len(l) for l in content_lines)
    if total_chars < 200:
        return True
    if meta.get("toc") and len(content_lines) < 5:
        headings = [l for l in lines if l.startswith("###")]
        if headings and all("http" in l for l in headings):
            return True
    return False


# ---------------------------------------------------------------------------
# Section splitting
# ---------------------------------------------------------------------------

def _split_by_h2(text: str) -> list[str]:
    """Split markdown body by ## headings, keeping the heading as part of its section."""
    sections = []
    current = ""
    lines = text.splitlines(keepends=True)
    for line in lines:
        if line.startswith("## "):
            if current.strip():
                sections.append(current.strip())
            current = line
        else:
            current += line
    if current.strip():
        sections.append(current.strip())
    return sections


def _split_long_section(section: str, max_chars: int = 2200, overlap: int = 200) -> list[str]:
    """Split an over-long section at paragraph boundaries, with overlap.

    Args:
        section: full section text (already includes H2 heading).
        max_chars: target max size per chunk.
        overlap: chars of overlap between consecutive chunks (tail of prev → head of next).
                 Helps retrieval when a query targets a sentence that straddles the boundary.
    """
    if len(section) <= max_chars:
        return [section]

    paras = re.split(r"\n\n+", section)
    chunks: list[str] = []
    current = ""

    def _tail(s: str, n: int) -> str:
        """Return last ~n chars of s, snapped to start of last paragraph if possible."""
        if len(s) <= n:
            return s
        tail = s[-n:]
        # snap to paragraph boundary for cleaner overlap
        first_para_break = tail.find("\n\n")
        if first_para_break != -1 and first_para_break < len(tail) - 50:
            tail = tail[first_para_break + 2:]
        return tail

    for para in paras:
        para = para.strip()
        if not para:
            continue

        if len(current) + len(para) + 2 <= max_chars:
            current += "\n\n" + para
        else:
            if current.strip():
                chunks.append(current.strip())
            # Carry over tail of current as overlap prefix
            overlap_prefix = _tail(current, overlap) if chunks else ""
            seed = (overlap_prefix + "\n\n" + para).strip() if overlap_prefix else para
            # If still too big, hard-split
            while len(seed) > max_chars:
                chunks.append(seed[:max_chars])
                seed = seed[max_chars - overlap:]
            current = seed

    if current.strip():
        chunks.append(current.strip())

    return chunks if chunks else [section]


# ---------------------------------------------------------------------------
# Chunk post-processing
# ---------------------------------------------------------------------------

# Patterns matched at the start of a chunk — these indicate TOC / nav content
# that should be stripped before embedding.
_TOC_LEADING_PATTERNS = [
    re.compile(r"^#{1,3}\s*\(?\s*[Nn]ội\s+dung\s+(chính|tóm\s+tắt)?\s*\)?[\s\W]*"),
    re.compile(r"^#{1,3}\s*\(?\s*[Tt]rang\s+\d+\s*\/?\d*\s*\)?[\s\W]*"),
    re.compile(r"^\s*\[ Toggle \]\s*\n"),
]

# Inline TOC lines (link-only lines) to strip anywhere in the chunk.
_TOC_INLINE_RE = re.compile(
    r"^\s*\[ Toggle \]\s*$|"
    r"^\s*\[ Toggle \]\(#\)\s*$|"
    r"^\s*\*\s*\[ [^\]]+ \]\(#ftoc[^\)]*\)"   # markdown list TOC links
    r"|"
    r"^\s*\d+\.\s*\[ [^\]]+ \]\(#ftoc[^\)]*\)"
    r"|"
    r"^\s*\{ Toggle \}\s*$"
    r"|"
    r"^\s*\[ [^\]]+ \]\(#[^\)]+\)\s*$"  # generic anchor links (fragile, be conservative)
    r"|"
    r"^\s*<!--[^-]*-->\s*$"             # HTML comments often seen in TOC blocks
)


def _strip_toc_from_chunk(text: str) -> str:
    """Remove leading TOC blocks and inline TOC link lines from chunk text."""
    lines = text.splitlines()
    stripped = 0

    # Strip leading TOC lines (the "### Nội dung chính\n1. [link]...\n2. [link]..." block)
    while lines:
        first = lines[0]
        # Check if it matches a TOC heading pattern
        matched_heading = False
        for pat in _TOC_LEADING_PATTERNS:
            if pat.match(first):
                lines.pop(0)
                stripped += 1
                matched_heading = True
                break

        if matched_heading:
            continue

        # After TOC heading, strip link-only lines until we hit real content
        # A "real" line has meaningful characters beyond markdown/link syntax
        if re.match(r"^\s*(\d+\.|[-*])\s*\[.+\]\(#", first):
            lines.pop(0)
            stripped += 1
        elif re.match(r"^\s*\[ Toggle \]", first):
            lines.pop(0)
            stripped += 1
        else:
            break

    # Strip trailing TOC link lines and other nav noise
    cleaned_lines = []
    for line in lines:
        if _TOC_INLINE_RE.match(line):
            continue  # skip TOC / nav lines
        # Also skip lines that are pure anchor links with no prose
        stripped_inline += 0  # no-op, just for clarity below
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines).strip()


# Global flag to track whether we're in a TOC section (used by the inline re above)
# We use a simple approach: count consecutive TOC lines from end of lines list.
stripped_inline = 0  # module-level scratch for readability; not used externally


def _strip_toc_from_chunk_v2(text: str) -> str:
    """Remove leading TOC blocks and inline TOC link lines from chunk text (v2, cleaner)."""
    lines = text.splitlines()
    result_lines: list[str] = []
    i = 0

    # 1. Skip leading TOC heading lines (### Nội dung chính, etc.)
    while i < len(lines):
        line = lines[i]
        matched = False
        for pat in _TOC_LEADING_PATTERNS:
            if pat.match(line):
                i += 1
                matched = True
                break
        if matched:
            continue

        # Skip consecutive link-only lines right after the TOC heading
        if re.match(r"^\s*(\d+\.|\*|-)\s*\[.+\]\(#", lines[i]) or \
           re.match(r"^\s*\[ Toggle \]", lines[i]):
            i += 1
            continue

        # Also skip HTML comment TOC toggles
        if re.match(r"^\s*<!--", lines[i]) or re.match(r"^\s*\{ Toggle \}", lines[i]):
            i += 1
            continue

        break

    # 2. Keep the rest; skip only clearly TOC nav lines that remain
    nav_link_re = re.compile(
        r"^\s*(\d+\.|\*|-)\s*\[.+\]\(#ftoc[^\)]*\)"
        r"|^\s*\[ Toggle \]\s*$"
        r"|^\s*<!--[^-]*-->"
        r"|^\s*\{ Toggle \}",
    )

    for line in lines[i:]:
        if nav_link_re.match(line):
            continue
        result_lines.append(line)

    return "\n".join(result_lines).strip()


def _is_toc_heavy(text: str) -> bool:
    """Return True if >70% of non-empty lines are TOC/nav links (likely a TOC chunk)."""
    lines = [l for l in text.splitlines() if l.strip()]
    if not lines:
        return False
    nav_re = re.compile(
        r"^\s*(\d+\.|\*|-)\s*\[.+\]\("
        r"|^\s*\[ Toggle \]"
        r"|^\s*<!--"
        r"|^\s*\{ Toggle \}"
        r"|^\s*\[ [^\]]+ \]\(#[^\)]+\)$"  # anchor-only links
    )
    nav_count = sum(1 for l in lines if nav_re.match(l))
    return nav_count / len(lines) > 0.7


def _postprocess_chunks(raw_chunks: list[str]) -> list[str]:
    """
    1. Strip TOC / nav noise from each chunk.
    2. Drop chunks that are >70% TOC lines.
    3. Merge tiny chunks (< 100 chars) with the previous chunk.
    """
    cleaned: list[str] = []

    for raw in raw_chunks:
        stripped = _strip_toc_from_chunk_v2(raw)

        # Drop TOC-heavy chunks entirely
        if _is_toc_heavy(stripped):
            continue

        # Merge tiny chunks into previous one
        if len(stripped) < 100 and cleaned:
            cleaned[-1] = cleaned[-1].rstrip() + "\n\n" + stripped
        else:
            cleaned.append(stripped)

    return [c for c in cleaned if c.strip()]


# ---------------------------------------------------------------------------
# Main entry points
# ---------------------------------------------------------------------------

def chunk_markdown_file(file_path: Path) -> list[Chunk]:
    """Parse a single markdown file and return semantic chunks."""
    raw = file_path.read_text(encoding="utf-8")
    meta, body = _strip_frontmatter(raw)

    if _is_index_page(body, meta):
        return []

    article_title = meta.get("title", file_path.stem)
    source = meta.get("source", "")
    section = meta.get("section") or meta.get("category") or ""

    h2_sections = _split_by_h2(body)
    all_chunks: list[Chunk] = []
    section_chunks: list[list[Chunk]] = []

    for sec_idx, section_text in enumerate(h2_sections):
        raw_parts = _split_long_section(section_text)
        parts = _postprocess_chunks(raw_parts)

        first_line = section_text.splitlines()[0] if section_text else ""
        section_title = first_line.lstrip("# ").strip() if first_line.startswith("#") else first_line.strip()
        if not section_title:
            section_title = f"Phần {sec_idx + 1}"

        sec_chunks: list[Chunk] = []
        for sub_idx, part in enumerate(parts):
            sec_chunks.append(Chunk(
                article_title=article_title,
                section_title=section_title,
                content=part,
                source=source,
                section=section,
                chunk_index=sec_idx * 1000 + sub_idx,
                total_chunks=0,
                file_path=str(file_path),
            ))
        section_chunks.append(sec_chunks)
        all_chunks.extend(sec_chunks)

    total = len(all_chunks)
    for sec_chunks in section_chunks:
        for c in sec_chunks:
            c.total_chunks = total

    return all_chunks


def ingest_directory(root_dir: Path) -> list[Chunk]:
    """Walk a directory tree and chunk all .md files."""
    all_chunks: list[Chunk] = []
    md_files = sorted(root_dir.rglob("*.md"))
    skipped = 0
    for f in md_files:
        try:
            chunks = chunk_markdown_file(f)
            if not chunks:
                skipped += 1
            all_chunks.extend(chunks)
        except Exception as e:
            print(f"[WARN] Failed to chunk {f}: {e}")
            skipped += 1
    print(f"[INFO] Chunks: {len(all_chunks)}, Skipped index pages: {skipped}")
    return all_chunks
