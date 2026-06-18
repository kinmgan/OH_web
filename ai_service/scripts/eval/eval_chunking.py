"""Eval chunking quality -- no Qdrant, no LLM needed, just stats + manual retrieval test."""
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

out_path = Path(__file__).parent / "eval_chunking_results.txt"
sys.stdout = Tee(out_path, sys.stdout)
sys.stderr = Tee(out_path, sys.stderr)
from collections import defaultdict

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from data_ingestion.health_ingestion import ingest_directory, Chunk


def print_stats(chunks: list[Chunk]):
    """Part 1: Basic chunk size statistics."""
    sizes = [len(c.content) for c in chunks]
    sizes.sort()

    print("\n" + "=" * 60)
    print("PART 1 -- CHUNK SIZE STATISTICS")
    print("=" * 60)
    print(f"  Total chunks         : {len(chunks)}")
    print(f"  Total chars          : {sum(sizes):,}")
    print(f"  Min / Max / Avg      : {min(sizes)} / {max(sizes)} / {sum(sizes)/len(sizes):.0f}")
    print(f"  Median (P50)          : {sizes[len(sizes)//2]}")
    print(f"  P25 / P75            : {sizes[len(sizes)//4]} / {sizes[3*len(sizes)//4]}")

    tiny  = [c for c in chunks if len(c.content) < 200]
    small = [c for c in chunks if 200 <= len(c.content) < 500]
    good  = [c for c in chunks if 500 <= len(c.content) <= 2000]
    large = [c for c in chunks if 2000 < len(c.content) <= 3000]
    huge  = [c for c in chunks if len(c.content) > 3000]

    print(f"\n  Size distribution:")
    print(f"    < 200 chars (tiny)  : {len(tiny):4d} ({100*len(tiny)/len(chunks):5.1f}%)  <<< may lack context")
    print(f"    200-499 (small)     : {len(small):4d} ({100*len(small)/len(chunks):5.1f}%)")
    print(f"    500-2000 (good)     : {len(good):4d} ({100*len(good)/len(chunks):5.1f}%)  <<< target range")
    print(f"    2000-3000 (large)   : {len(large):4d} ({100*len(large)/len(chunks):5.1f}%)")
    print(f"    > 3000 (huge)       : {len(huge):4d} ({100*len(huge)/len(chunks):5.1f}%)  <<< may be hard to retrieve")

    if tiny:
        print(f"\n  [WARN] {len(tiny)} tiny chunks (<200 chars) -- sample:")
        for c in tiny[:3]:
            print(f"    [{c.article_title}] '{c.section_title}' ({len(c.content)} chars)")
            print(f"      {c.content[:120]}...")

    if huge:
        print(f"\n  [WARN] {len(huge)} huge chunks (>3000 chars) -- sample:")
        for c in huge[:3]:
            print(f"    [{c.article_title}] '{c.section_title}' ({len(c.content)} chars)")
            print(f"      {c.content[:120]}...")


def print_section_coverage(chunks: list[Chunk]):
    """Part 2: How chunks map to sections."""
    print("\n" + "=" * 60)
    print("PART 2 -- SECTION COVERAGE")
    print("=" * 60)

    article_sections: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for c in chunks:
        article_sections[c.article_title][c.section_title] += 1

    articles_with_many_chunks = sorted(
        [(a, max(sections.values())) for a, sections in article_sections.items()],
        key=lambda x: -x[1]
    )

    gt3 = sum(1 for _, m in articles_with_many_chunks if m > 3)
    gt5 = sum(1 for _, m in articles_with_many_chunks if m > 5)
    gt10 = sum(1 for _, m in articles_with_many_chunks if m > 10)

    print(f"  Articles with >3 chunks : {gt3}")
    print(f"  Articles with >5 chunks : {gt5}")
    print(f"  Articles with >10 chunks: {gt10}")

    print(f"\n  Top 10 articles by chunk count:")
    for title, max_sec in articles_with_many_chunks[:10]:
        short = title[:50] + "..." if len(title) > 50 else title
        print(f"    {max_sec:3d} chunks  {short}")


def print_cross_section_risk(chunks: list[Chunk]):
    """Part 3: Detect chunks that contain multiple H2 sections (bad split)."""
    print("\n" + "=" * 60)
    print("PART 3 -- CROSS-SECTION RISK (chunks with >1 H2 heading)")
    print("=" * 60)

    import re

    # True H2 headings: line starts with "## " followed by real text (not a link like [text](#anchor))
    # We match only if the "## " is NOT inside square brackets or parentheses
    # Simple heuristic: count "## " at start of line that have non-link text after them
    risky = []
    for c in chunks:
        lines = c.content.splitlines()
        h2_count = 0
        for line in lines:
            if line.startswith("## "):
                rest = line[3:].strip()
                # Count as real heading only if it doesn't look like an anchor
                if rest and not rest.startswith("[") and not rest.startswith("("):
                    h2_count += 1
        if h2_count > 1:
            risky.append((c, h2_count))

    if not risky:
        print("  All chunks contain at most 1 H2 heading -- looks clean!")
    else:
        print(f"  {len(risky)} chunks contain multiple H2 headings -- sample:")
        for c, count in risky[:5]:
            print(f"    [{c.article_title}] '{c.section_title}' -- {count + 1} H2 headings ({len(c.content)} chars)")
            print(f"      First 100 chars: {c.content[:100]}...")
            print()


def print_ingestion_report(chunks: list[Chunk]):
    """Part 4: Ingestion summary by source."""
    print("\n" + "=" * 60)
    print("PART 4 -- INGESTION SUMMARY")
    print("=" * 60)

    by_section: dict[str, int] = defaultdict(int)
    by_source: dict[str, int] = defaultdict(int)
    for c in chunks:
        by_section[c.section] += 1
        if c.source:
            by_source[c.source] += 1

    print(f"  By section:")
    for sec, count in sorted(by_section.items(), key=lambda x: -x[1]):
        print(f"    {sec or '(none)':<30} : {count:>4} chunks")

    print(f"\n  By source (top 5):")
    for src, count in sorted(by_source.items(), key=lambda x: -x[1])[:5]:
        print(f"    {src[:60]:<60} : {count:>4} chunks")


def sample_chunks_for_review(chunks: list[Chunk], n: int = 5):
    """Part 5: Print random sample chunks for human review."""
    print("\n" + "=" * 60)
    print("PART 5 -- SAMPLE CHUNKS FOR MANUAL REVIEW")
    print("=" * 60)
    print("  Review these by eye. Good chunks should:")
    print("  - Have complete semantic sense (not mid-sentence)")
    print("  - Contain useful medical info (not just nav/toC)")
    print("  - Not be too short (<100 chars) or too long (>2000 chars)")
    print()

    import random
    random.seed(42)
    sample = random.sample(chunks, min(n, len(chunks)))

    for i, c in enumerate(sample, 1):
        print(f"  --- Chunk {i}/{n} ---")
        print(f"  File     : {c.file_path.split('output')[-1]}")
        print(f"  Article  : {c.article_title}")
        print(f"  Section  : {c.section_title}")
        print(f"  Size     : {len(c.content)} chars / {len(c.content.split())} words")
        print(f"  Content  :\n    {c.content[:500]}")
        print()


def main():
    root_dir = Path(__file__).parent.parent.parent / "data_ingestion" / "crawlers" / "output"

    if not root_dir.exists():
        print(f"[FAIL] Directory not found: {root_dir}")
        return

    print(f"Scanning {root_dir} ...")
    chunks = ingest_directory(root_dir)

    if not chunks:
        print("[FAIL] No chunks produced.")
        return

    print_stats(chunks)
    print_section_coverage(chunks)
    print_cross_section_risk(chunks)
    print_ingestion_report(chunks)
    sample_chunks_for_review(chunks)

    print("=" * 60)
    print("NEXT STEPS:")
    print("  1. If many tiny chunks: chunking is too aggressive")
    print("  2. If many huge chunks: max_chars=1500 is too small for this data")
    print("  3. If cross-section risk > 0: _split_long_section is merging sections")
    print("  4. If samples look bad: adjust max_chars or split logic")
    print("  5. Once stats look good: run eval_retrieval.py to test semantic search")
    print("=" * 60)


if __name__ == "__main__":
    main()
