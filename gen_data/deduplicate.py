import os
import json

def deduplicate():
    # Thư mục hiện tại (gen_data)
    folder = os.path.dirname(os.path.abspath(__file__))
    files = [f for f in os.listdir(folder) if f.endswith('.json')]
    
    # Ưu tiên duyệt một số file quan trọng trước (tùy chọn), nhưng ở đây duyệt theo bảng chữ cái
    files.sort()
    
    seen_names = set()
    total_removed = 0
    
    print(f"{'File':<25} | {'Giữ lại':<10} | {'Đã xóa (Trùng)':<15}")
    print("-" * 55)
    
    for file in files:
        filepath = os.path.join(folder, file)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            original_count = len(data.get('products', []))
            new_products = []
            
            for p in data.get('products', []):
                name = p.get('name', '').strip()
                if not name:
                    continue
                    
                norm_name = name.lower()
                if norm_name not in seen_names:
                    seen_names.add(norm_name)
                    new_products.append(p)
                    
            data['products'] = new_products
            removed_count = original_count - len(new_products)
            total_removed += removed_count
            
            # Ghi lại file đã lọc
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            print(f"{file:<25} | {len(new_products):<10} | {removed_count:<15}")
            
        except Exception as e:
            print(f"Lỗi xử lý {file}: {e}")
            
    print("-" * 55)
    print(f"Hoàn tất! Tổng cộng đã xóa {total_removed} vị thuốc bị trùng lặp ở các file phụ.")
    print(f"Tổng số vị thuốc hiện tại: {len(seen_names)}")

if __name__ == '__main__':
    deduplicate()
