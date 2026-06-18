import json
import re
import sys
import io
import unicodedata
from collections import Counter

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# Load probe_report.json
with open("data/probe_report.json", "r", encoding="utf-8") as f:
    probe = json.load(f)

# Load tcm_synonyms
sys.path.insert(0, "data_ingestion")
from tcm_synonyms import TCM_SYNONYMS

# Normalize function: lowercase + remove diacritics
def normalize(s):
    if not s:
        return ""
    s = s.lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s

# 1. Get all TCM terms from probe_report tag_counter (the keys)
probe_tags = list(probe["tag_counter"].keys())
probe_counts = probe["tag_counter"]

# Normalize all TCM_SYNONYMS keys
tcm_synonyms_normalized = {normalize(k): k for k in TCM_SYNONYMS.keys()}

# 2. Find tags from probe that are NOT in TCM_SYNONYMS (after normalization)
missing = {}
for tag in probe_tags:
    norm = normalize(tag)
    if norm not in tcm_synonyms_normalized:
        missing[tag] = probe_counts[tag]

# Sort by count descending
missing_sorted = sorted(missing.items(), key=lambda x: -x[1])

print("=" * 60)
print("PART 1: TCM terms from probe_report tag_counter NOT in TCM_SYNONYMS")
print("=" * 60)
for term, count in missing_sorted:
    print(f"  {term}: {count}")

# 3. Scan desc fields for TCM action phrases appearing >2 times
print("\n" + "=" * 60)
print("PART 2: TCM action phrases from desc fields (>2 occurrences)")
print("=" * 60)

# Collect all desc texts
all_descs = " ".join(p.get("desc", "") for p in probe.get("samples", []))

# Clean and tokenize
desc_cleaned = re.sub(r'[.,;:!?/()]+', ' ', all_descs.lower())
words = desc_cleaned.split()

# Count 2-word and 3-word phrases
two_word = Counter()
three_word = Counter()

for i in range(len(words) - 1):
    two_word[" ".join(words[i:i+2])] += 1
for i in range(len(words) - 2):
    three_word[" ".join(words[i:i+3])] += 1

# Combine and filter
all_phrases = {}
for phrase, count in two_word.items():
    if count > 2 and len(phrase) > 4:
        all_phrases[phrase] = count
for phrase, count in three_word.items():
    if count > 2:
        all_phrases[phrase] = count

# Check which are NOT in TCM_SYNONYMS (after normalization)
missing_phrases = {}
for phrase, count in all_phrases.items():
    norm = normalize(phrase)
    if norm not in tcm_synonyms_normalized:
        missing_phrases[phrase] = count

# Sort by count descending
missing_phrases_sorted = sorted(missing_phrases.items(), key=lambda x: -x[1])

print(f"Total unique phrases found in descs (>2x): {len(all_phrases)}")
print(f"Phrases NOT in TCM_SYNONYMS: {len(missing_phrases_sorted)}")
print()
for phrase, count in missing_phrases_sorted[:50]:
    print(f"  {phrase}: {count}")
