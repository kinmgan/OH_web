import os
import json
from collections import defaultdict

def main():
    # Folder is the directory where the script is located
    folder = os.path.dirname(os.path.abspath(__file__))
    files = [f for f in os.listdir(folder) if f.endswith('.json')]
    
    # Dictionary mapping normalized herb name to list of occurrences
    herb_to_categories = defaultdict(list)
    
    for file in files:
        filepath = os.path.join(folder, file)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                category_name = data.get('category_name', file.replace('.json', ''))
                products = data.get('products', [])
                for prod in products:
                    name = prod.get('name', '').strip()
                    if name:
                        # Normalize to lowercase for case-insensitive comparison
                        norm_name = name.lower()
                        herb_to_categories[norm_name].append({
                            'original_name': name,
                            'category': category_name,
                            'file': file
                        })
        except Exception as e:
            print(f"Error reading {file}: {e}")

    # Find duplicates
    duplicates = {}
    for norm_name, occurrences in herb_to_categories.items():
        if len(occurrences) > 1:
            duplicates[norm_name] = occurrences

    if not duplicates:
        print("Tuyệt vời! Không có sự trùng lặp nào giữa các phân loại.")
        return

    print(f"Phát hiện {len(duplicates)} vị thuốc bị trùng lặp:")
    print("-" * 60)
    for norm_name, occurrences in duplicates.items():
        original_name = occurrences[0]['original_name']
        print(f"🔹 Vị thuốc: {original_name} (xuất hiện {len(occurrences)} lần)")
        for occ in occurrences:
            print(f"  - Phân loại: {occ['category']} (File: {occ['file']})")
        print("-" * 60)

if __name__ == '__main__':
    main()
