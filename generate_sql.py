import json
import os
import glob

input_dir = 'gen_data'
output_sql = 'plan/insert_all_herbs.sql'

def escape_sql(s):
    if s is None:
        return ''
    return s.replace("'", "''")

def get_prefix(cat_code):
    parts = cat_code.split('_')
    return ''.join([p[0] for p in parts]).upper()

def main():
    json_files = glob.glob(os.path.join(input_dir, '*.json'))
    
    product_id = 100
    variant_id = 100
    image_id = 100
    
    with open(output_sql, 'w', encoding='utf-8') as f:
        f.write("-- Auto-generated insert script for medicinal herbs\n")
        f.write("BEGIN;\n\n")
        
        for file in json_files:
            with open(file, 'r', encoding='utf-8') as jf:
                data = json.load(jf)
                
            cat_id = data.get('category_id', 1)
            cat_code = data.get('category_code', 'CAT')
            prefix = get_prefix(cat_code)
            
            products = data.get('products', [])
            
            for i, p in enumerate(products):
                name = escape_sql(p.get('name', ''))
                desc = escape_sql(p.get('short_desc', ''))
                origin = escape_sql(p.get('origin', ''))
                sku = f"{prefix}-{str(i+1).zfill(3)}"
                min_price = p.get('price_hint', 50000)
                unit_name = escape_sql(p.get('unit', 'Gói 500g'))
                if not unit_name:
                    unit_name = 'Gói 500g'
                
                tags = p.get('tags', [])
                tags_str = "ARRAY[" + ", ".join([f"'{escape_sql(t)}'" for t in tags]) + "]"
                
                cert_url = f"https://picsum.photos/seed/cert_{product_id}/400/400"
                image_url = f"https://picsum.photos/seed/herb_{product_id}/400/400"
                
                f.write(f"INSERT INTO public.products (id, name, sku, description, origin, tags, category_id, min_price, certificate_images, created_at, average_rating, sold_quantity)\n")
                f.write(f"VALUES ({product_id}, '{name}', '{sku}', '{desc}', '{origin}', {tags_str}, {cat_id}, {min_price}, ARRAY['{cert_url}'], CURRENT_TIMESTAMP, 5.0, 100);\n")
                
                property_val = p.get('property')
                if property_val:
                    if property_val == 'HOI_HAN':
                        property_val = 'LUONG'
                    f.write(f"INSERT INTO public.product_properties (product_id, property) VALUES ({product_id}, '{property_val}');\n")
                    
                for flavor in p.get('flavors', []):
                    if flavor == 'CHAT':
                        flavor = 'CHUA'
                    f.write(f"INSERT INTO public.product_flavors (product_id, flavor) VALUES ({product_id}, '{flavor}');\n")
                    
                for meridian in p.get('meridians', []):
                    if meridian == 'TIỂU_TRANG':
                        meridian = 'TIEU_TRANG'
                    f.write(f"INSERT INTO public.product_meridians (product_id, meridian) VALUES ({product_id}, '{meridian}');\n")
                    
                # Variant
                f.write(f"INSERT INTO public.product_variants (product_variant_id, product_id, price, stock_quantity, unit_name, height_cm, length_cm, weight_gram, width_cm)\n")
                f.write(f"VALUES ({variant_id}, {product_id}, {min_price}, 500, '{unit_name}', 20, 15, 500, 5);\n")
                
                # Image
                f.write(f"INSERT INTO public.product_images (id, product_id, product_image_url, image_public_id, is_default)\n")
                f.write(f"VALUES ({image_id}, {product_id}, '{image_url}', 'herb_img_{product_id}', true);\n")
                
                f.write("\n")
                
                product_id += 1
                variant_id += 1
                image_id += 1
                
        f.write("-- Reset sequence to continue auto-increment correctly\n")
        f.write("SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));\n")
        f.write("SELECT setval('product_variants_product_variant_id_seq', (SELECT MAX(product_variant_id) FROM product_variants));\n")
        f.write("SELECT setval('product_images_id_seq', (SELECT MAX(id) FROM product_images));\n")
        f.write("\nCOMMIT;\n")

if __name__ == '__main__':
    main()
