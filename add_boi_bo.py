import json
import os

new_herbs = [
  {
    "name": "Sâm ngọc linh",
    "origin": "Rễ củ của cây Sâm ngọc linh (Panax vietnamensis), họ Nhân sâm.",
    "flavors": ["NGOT", "DANG"],
    "property": "ON",
    "meridians": ["TAM", "THAN", "TY", "PHE"],
    "tags": ["Bổ Khí", "Bổ Huyết", "Sinh Tân"],
    "short_desc": "Đại bổ nguyên khí, tăng cường thể lực và trí lực. Giúp sinh tân dịch, chống suy nhược sinh dục và cơ thể.",
    "price_hint": 50000000,
    "unit": "100g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Hồng sâm",
    "origin": "Rễ củ qua chế biến hấp sấy của Nhân sâm (Panax ginseng), họ Nhân sâm.",
    "flavors": ["NGOT", "DANG"],
    "property": "ON",
    "meridians": ["PHE", "TY", "TAM"],
    "tags": ["Đại Bổ Nguyên Khí", "Ích Huyết", "An Thần"],
    "short_desc": "Đại bổ nguyên khí, phục mạch cố thoát, ích khí nhiếp huyết. Chuyên dùng cho các trường hợp tỳ hư, khí hư, cơ thể suy kiệt.",
    "price_hint": 2000000,
    "unit": "Hộp 100g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Cao ban long",
    "origin": "Cao nấu từ sừng non hoặc sừng già của loài Hươu nai (Cervus nippon), họ Hươu nai.",
    "flavors": ["NGOT", "MAN"],
    "property": "ON",
    "meridians": ["CAN", "THAN"],
    "tags": ["Bổ Dương", "Bổ Huyết", "Sinh Tinh"],
    "short_desc": "Bổ trung ích khí, tráng dương, sinh tinh, chỉ huyết. Rất tốt cho người gầy yếu, suy nhược, xuất huyết.",
    "price_hint": 1200000,
    "unit": "100g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Miết giáp",
    "origin": "Mai phơi khô của con Ba ba (Trionyx sinensis), họ Ba ba.",
    "flavors": ["MAN"],
    "property": "HAN",
    "meridians": ["CAN", "THAN"],
    "tags": ["Tư Âm", "Tiềm Dương", "Nhuyễn Kiên"],
    "short_desc": "Tư âm tiềm dương, thoái nhiệt, nhuyễn kiên tán kết. Chuyên trị các chứng âm hư hỏa vượng, sốt về chiều.",
    "price_hint": 450000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Phong mật",
    "origin": "Mật ong do loài Ong mật (Apis cerana) thu thập từ các loại hoa.",
    "flavors": ["NGOT"],
    "property": "BINH",
    "meridians": ["PHE", "TY", "DAI_TRANG"],
    "tags": ["Bổ Trung", "Nhuận Phế", "Giải Độc"],
    "short_desc": "Bổ trung ích khí, nhuận phế chỉ khái, nhuận tràng thông tiện. Giúp bồi bổ tỳ vị, giảm ho và làm dịu đau nhức.",
    "price_hint": 350000,
    "unit": "Lít",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Hạch đào nhân",
    "origin": "Nhân hạt sấy khô của cây Óc chó (Juglans regia), họ Hồ đào.",
    "flavors": ["NGOT"],
    "property": "ON",
    "meridians": ["THAN", "PHE", "DAI_TRANG"],
    "tags": ["Bổ Thận", "Ôn Phế", "Nhuận Tràng"],
    "short_desc": "Bổ thận tráng dương, ôn phế định suyễn, nhuận tràng thông tiện. Thường dùng chữa thận hư, ho suyễn, táo bón.",
    "price_hint": 250000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Nam sa sâm",
    "origin": "Rễ phơi hoặc sấy khô của cây Nam sa sâm (Adenophora tetraphylla), họ Hoa chuông.",
    "flavors": ["NGOT", "DANG"],
    "property": "LUONG",
    "meridians": ["PHE", "VI"],
    "tags": ["Dưỡng Âm", "Thanh Phế", "Sinh Tân"],
    "short_desc": "Dưỡng âm thanh phế, sinh tân chỉ khát, hóa đờm. Chủ trị phế nhiệt táo khái, hư lao sinh ho.",
    "price_hint": 300000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Ngân nhĩ",
    "origin": "Thể quả phơi hoặc sấy khô của nấm Mộc nhĩ trắng (Tremella fuciformis), họ Mộc nhĩ trắng.",
    "flavors": ["NGOT", "NHAT"],
    "property": "BINH",
    "meridians": ["PHE", "VI", "THAN"],
    "tags": ["Tư Âm", "Nhuận Phế", "Sinh Tân"],
    "short_desc": "Tư âm nhuận phế, dưỡng vị sinh tân. Dùng rất tốt cho người suy nhược, phế vị âm hư, ho khan.",
    "price_hint": 350000,
    "unit": "Gói 200g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Hải sâm",
    "origin": "Thân phơi hoặc sấy khô của con Hải sâm (Holothuria), họ Hải sâm.",
    "flavors": ["MAN", "NGOT"],
    "property": "ON",
    "meridians": ["TAM", "THAN"],
    "tags": ["Bổ Thận", "Ích Tinh", "Dưỡng Huyết"],
    "short_desc": "Bổ thận ích tinh, dưỡng huyết nhuận táo. Chủ trị tinh huyết suy tổn, cơ thể gầy yếu, liệt dương.",
    "price_hint": 1500000,
    "unit": "Gói 200g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Tổ yến",
    "origin": "Tổ chim sấy khô của loài Yến hàng (Aerodramus fuciphagus), họ Yến.",
    "flavors": ["NGOT"],
    "property": "BINH",
    "meridians": ["PHE", "VI", "THAN"],
    "tags": ["Dưỡng Âm", "Bổ Phế", "Ích Khí"],
    "short_desc": "Dưỡng âm nhuận phế, bổ trung ích khí. Thường dùng cho người ốm yếu suy nhược, lao phổi, ho ra máu.",
    "price_hint": 3500000,
    "unit": "Hộp 50g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Nguyên tàm nga",
    "origin": "Tằm đực sống phơi hoặc sấy khô (Bombyx mori), họ Tằm tơ.",
    "flavors": ["MAN"],
    "property": "ON",
    "meridians": ["THAN", "CAN"],
    "tags": ["Bổ Thận", "Tráng Dương", "Sáp Tinh"],
    "short_desc": "Bổ thận tráng dương, cố tinh bớt sáp. Chữa di tinh, hoạt tinh, liệt dương do thận hư.",
    "price_hint": 450000,
    "unit": "Gói 200g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Phục thần",
    "origin": "Phần nấm Phục linh (Poria cocos) ôm lấy rễ cây thông, họ Polyporaceae.",
    "flavors": ["NGOT", "NHAT"],
    "property": "BINH",
    "meridians": ["TAM", "TY"],
    "tags": ["Bổ Tâm", "An Thần", "Kiện Tỳ"],
    "short_desc": "Bổ tâm an thần, kiện tỳ, lợi thủy. Thường dùng chữa tâm hồi hộp, mất ngủ, hay quên.",
    "price_hint": 400000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Cát sâm",
    "origin": "Rễ củ phơi khô của cây Cát sâm (Millettia speciosa), họ Đậu.",
    "flavors": ["NGOT"],
    "property": "BINH",
    "meridians": ["TY", "PHE"],
    "tags": ["Bổ Khí", "Sinh Tân", "Chỉ Khát"],
    "short_desc": "Bổ tỳ phế, sinh tân dịch, chỉ khát. Chuyên dùng cho người tỳ vị hư yếu, mệt mỏi, ho khan.",
    "price_hint": 180000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Hải long",
    "origin": "Toàn thân phơi hoặc sấy khô của loài Rồng biển (Syngnathus), họ Cá ngựa.",
    "flavors": ["NGOT", "MAN"],
    "property": "ON",
    "meridians": ["CAN", "THAN"],
    "tags": ["Bổ Thận", "Tráng Dương", "Tiêu Thũng"],
    "short_desc": "Bổ thận tráng dương, hoạt huyết tiêu sưng. Có công năng tương tự Hải mã nhưng thiên về tiêu sưng tán kết.",
    "price_hint": 800000,
    "unit": "Hộp 100g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Lộc giác sương",
    "origin": "Bã gạc hươu nai (Cervus nippon) phơi khô sau khi đã ninh lấy cao.",
    "flavors": ["NGOT", "MAN"],
    "property": "ON",
    "meridians": ["CAN", "THAN"],
    "tags": ["Ôn Thận", "Trợ Dương", "Cố Tinh"],
    "short_desc": "Ôn thận trợ dương, thu liễm cố sáp. Trị các chứng tỳ vị hư hàn, nôn mửa, bạch đới, tiêu chảy kéo dài.",
    "price_hint": 200000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Hà thủ ô trắng",
    "origin": "Rễ phơi khô của cây Hà thủ ô trắng (Streptocaulon juventas), họ Thiên lý.",
    "flavors": ["DANG", "CHAT"],
    "property": "LUONG",
    "meridians": ["CAN", "THAN"],
    "tags": ["Bổ Huyết", "Thanh Nhiệt", "Giải Độc"],
    "short_desc": "Bổ máu, thanh nhiệt, giải độc. Thường dùng thay thế Hà thủ ô đỏ để dưỡng huyết, giúp ăn ngủ tốt.",
    "price_hint": 150000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Thổ sâm",
    "origin": "Rễ củ phơi khô của cây Sâm đất (Talinum paniculatum), họ Rau sam.",
    "flavors": ["NGOT"],
    "property": "BINH",
    "meridians": ["TY", "PHE"],
    "tags": ["Bổ Khí", "Nhuận Phế", "Sinh Tân"],
    "short_desc": "Bổ trung ích khí, nhuận phế, sinh tân dịch. Hỗ trợ tiêu hóa, chữa ho mệt mỏi, đổ mồ hôi trộm.",
    "price_hint": 120000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Sâm báo",
    "origin": "Rễ củ phơi khô của cây Sâm báo (Abelmoschus sagittifolius), họ Cẩm quỳ.",
    "flavors": ["NGOT", "NHAT"],
    "property": "BINH",
    "meridians": ["TY", "PHE"],
    "tags": ["Bổ Tỳ", "Dưỡng Vị", "Sinh Tân"],
    "short_desc": "Bổ tỳ vị, dưỡng âm, sinh tân dịch. Dùng bồi bổ cơ thể gầy yếu, suy nhược, ăn uống kém.",
    "price_hint": 280000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Ô cốt kê",
    "origin": "Gà ác nguyên con (Gallus domesticus), họ Trĩ.",
    "flavors": ["NGOT"],
    "property": "BINH",
    "meridians": ["CAN", "THAN", "PHE"],
    "tags": ["Bổ Can Thận", "Ích Khí Huyết", "Thoái Nhiệt"],
    "short_desc": "Bổ can thận, ích khí dưỡng huyết, thoái hư nhiệt. Dùng đặc trị chứng hư nhược, phụ nữ sau sinh.",
    "price_hint": 80000,
    "unit": "Con",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Thạch quyết minh",
    "origin": "Vỏ phơi khô của các loài Bào ngư (Haliotis), họ Bào ngư.",
    "flavors": ["MAN"],
    "property": "HAN",
    "meridians": ["CAN", "THAN"],
    "tags": ["Bình Can", "Tiềm Dương", "Minh Mục"],
    "short_desc": "Bình can tiềm dương, dưỡng âm minh mục. Chuyên dùng bồi bổ và chữa đau đầu, hoa mắt, thị lực giảm.",
    "price_hint": 450000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  }
]

file_path = "gen_data/BOI_BO.json"

if os.path.exists(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    existing_names = [item.get("name", "").lower() for item in data.get("products", [])]
    for herb in new_herbs:
        if herb["name"].lower() not in existing_names:
            data["products"].append(herb)
            
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
else:
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(new_herbs, f, ensure_ascii=False, indent=2)

with open("gen_data/all_existing_herbs.txt", "a", encoding="utf-8") as f:
    for herb in new_herbs:
        f.write(herb["name"].lower() + "\n")

print(json.dumps(new_herbs, ensure_ascii=False, indent=2))
