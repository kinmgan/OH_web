import json

new_herbs = [
    {
        "name": "Dã cúc hoa",
        "origin": "Hoa phơi khô của cây Cúc dại (Chrysanthemum indicum)",
        "flavors": ["DANG", "CAY"],
        "property": "HAN",
        "meridians": ["PHE", "CAN"],
        "tags": ["Thanh nhiệt", "Giải độc", "Tán phong nhiệt"],
        "short_desc": "Dã cúc hoa có vị đắng cay, tính hơi hàn. Có công năng thanh nhiệt giải độc mạnh, chuyên trị đinh nhọt sưng đau, mắt đỏ sưng tấy.",
        "price_hint": 250000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Bạch tiên bì",
        "origin": "Vỏ rễ phơi khô của cây Bạch tiên (Dictamnus dasycarpus)",
        "flavors": ["DANG"],
        "property": "HAN",
        "meridians": ["TY", "VI", "BANG_QUANG"],
        "tags": ["Thanh nhiệt", "Táo thấp", "Giải độc"],
        "short_desc": "Vỏ rễ Bạch tiên bì vị đắng tính hàn. Công năng thanh nhiệt táo thấp, khu phong giải độc, chữa phong thấp tỳ rát, thấp chẩn lở loét ngoài da.",
        "price_hint": 320000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Tần bì",
        "origin": "Vỏ thân, vỏ cành phơi khô của cây Tần bì (Fraxinus rhynchophylla)",
        "flavors": ["DANG"],
        "property": "HAN",
        "meridians": ["CAN", "DOM", "DAI_TRANG"],
        "tags": ["Thanh nhiệt", "Táo thấp", "Minh mục"],
        "short_desc": "Tần bì có tác dụng thanh nhiệt táo thấp, thu sáp, làm sáng mắt. Thường dùng trị chứng xích lỵ, đới hạ, mắt đỏ sưng đau do can nhiệt.",
        "price_hint": 280000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Bại tương thảo",
        "origin": "Toàn cây phơi khô của Bại tương (Patrinia scabiosaefolia)",
        "flavors": ["DANG", "CAY"],
        "property": "HAN",
        "meridians": ["DAI_TRANG", "CAN", "VI"],
        "tags": ["Thanh nhiệt", "Giải độc", "Bài nùng"],
        "short_desc": "Bại tương thảo giúp thanh nhiệt giải độc, phá ứ huyết, trừ mủ (bài nùng). Vị thuốc đặc trị chứng trường ung (viêm ruột non, viêm ruột thừa) sưng đau.",
        "price_hint": 180000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Hồng đằng",
        "origin": "Thân dây phơi khô của cây Đại huyết đằng (Sargentodoxa cuneata)",
        "flavors": ["DANG"],
        "property": "BINH",
        "meridians": ["DAI_TRANG", "CAN"],
        "tags": ["Thanh nhiệt", "Giải độc", "Hoạt huyết"],
        "short_desc": "Hồng đằng có công dụng thanh nhiệt giải độc, hoạt huyết chỉ thống, tiêu thũng. Chuyên trị các chứng trường ung, phong thấp đau nhức xương khớp.",
        "price_hint": 150000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Nhẫn đông đằng",
        "origin": "Đoạn dây thân non của cây Kim ngân (Lonicera japonica)",
        "flavors": ["NGOT"],
        "property": "HAN",
        "meridians": ["TAM", "PHE"],
        "tags": ["Thanh nhiệt", "Giải độc", "Thông lạc"],
        "short_desc": "Nhẫn đông đằng là dây kim ngân, vừa có tác dụng thanh nhiệt giải độc tương tự hoa, vừa giúp sơ phong thông lạc chữa lở ngứa, đau nhức gân cốt.",
        "price_hint": 140000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Lậu lô",
        "origin": "Rễ phơi khô của cây Lậu lô (Rhaponticum uniflorum)",
        "flavors": ["DANG"],
        "property": "HAN",
        "meridians": ["VI", "DAI_TRANG"],
        "tags": ["Thanh nhiệt", "Giải độc", "Hạ nhũ"],
        "short_desc": "Rễ lậu lô có công năng thanh nhiệt giải độc, tiêu thũng bài nùng. Đặc biệt giúp lợi sữa (thông nhũ), chữa vú sưng đau do tắc tia sữa.",
        "price_hint": 260000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Mã tiên thảo",
        "origin": "Toàn cây phơi khô của Cỏ roi ngựa (Verbena officinalis)",
        "flavors": ["DANG"],
        "property": "LUONG",
        "meridians": ["CAN", "TY"],
        "tags": ["Thanh nhiệt", "Giải độc", "Hoạt huyết"],
        "short_desc": "Mã tiên thảo giúp thanh nhiệt giải độc, hoạt huyết tán ứ, lợi thủy. Thường dùng trị sốt rét, phù thũng, mụn nhọt sưng viêm ngoài da.",
        "price_hint": 120000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Bạch vi",
        "origin": "Rễ phơi khô của cây Bạch vi (Cynanchum atratum)",
        "flavors": ["DANG", "MAN"],
        "property": "HAN",
        "meridians": ["VI", "CAN", "THAN"],
        "tags": ["Thanh nhiệt", "Lương huyết", "Lợi niệu"],
        "short_desc": "Bạch vi chủ trị thanh nhiệt lương huyết, lợi niệu thông lâm, giải độc. Rất tốt cho chứng âm hư phát nhiệt, ôn tà thương âm gây sốt kéo dài.",
        "price_hint": 290000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Hồ hoàng liên",
        "origin": "Thân rễ phơi khô của Hồ hoàng liên (Picrorhiza kurroa)",
        "flavors": ["DANG"],
        "property": "HAN",
        "meridians": ["CAN", "VI", "DAI_TRANG"],
        "tags": ["Thanh nhiệt", "Táo thấp", "Thoái hư nhiệt"],
        "short_desc": "Hồ hoàng liên vị rất đắng, giúp thanh nhiệt táo thấp, tả hỏa thoái hư nhiệt. Chuyên trị trẻ em cam tích, cốt chưng lao nhiệt, thấp nhiệt tả lỵ.",
        "price_hint": 450000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Mật mông hoa",
        "origin": "Nụ hoa phơi khô của cây Mật mông (Buddleja officinalis)",
        "flavors": ["NGOT"],
        "property": "LUONG",
        "meridians": ["CAN"],
        "tags": ["Thanh nhiệt", "Tả hỏa", "Minh mục"],
        "short_desc": "Mật mông hoa có công dụng thanh nhiệt tả hỏa, dưỡng can minh mục. Vị thuốc chuyên trị đau mắt đỏ, nhiều tia máu, mờ mắt do can dương vượng.",
        "price_hint": 310000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Cốc tinh thảo",
        "origin": "Cụm hoa khô của cây Cốc tinh thảo (Eriocaulon buergerianum)",
        "flavors": ["CAY", "NGOT"],
        "property": "LUONG",
        "meridians": ["CAN", "VI"],
        "tags": ["Phân tán phong nhiệt", "Minh mục"],
        "short_desc": "Cốc tinh thảo giúp sơ tán phong nhiệt ở phần đầu mặt, làm sáng mắt, thấu ế màng mộng. Chuyên chữa viêm kết mạc, đau răng do phong hỏa.",
        "price_hint": 240000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Thanh tương tử",
        "origin": "Hạt chín phơi khô của cây Mào gà trắng (Celosia argentea)",
        "flavors": ["DANG"],
        "property": "HAN",
        "meridians": ["CAN"],
        "tags": ["Thanh can", "Tả hỏa", "Minh mục"],
        "short_desc": "Thanh tương tử có tác dụng thanh can tả hỏa, minh mục thoái ế. Thường dùng chữa chứng can hỏa vượng gây mắt đỏ sưng đau, cao huyết áp.",
        "price_hint": 190000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Đại kế",
        "origin": "Toàn cây phơi khô của cây Đại kế (Cirsium japonicum)",
        "flavors": ["NGOT", "DANG"],
        "property": "LUONG",
        "meridians": ["TAM", "CAN"],
        "tags": ["Lương huyết", "Chỉ huyết", "Tiêu ung"],
        "short_desc": "Đại kế có tác dụng làm mát máu, cầm máu, thanh nhiệt tiêu thũng. Vị thuốc đặc trị thổ huyết, khái huyết, băng lậu, mụn nhọt sưng đau rộp.",
        "price_hint": 160000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Tiểu kế",
        "origin": "Toàn cây phơi khô của cây Tiểu kế (Cirsium setosum)",
        "flavors": ["NGOT", "DANG"],
        "property": "LUONG",
        "meridians": ["TAM", "CAN"],
        "tags": ["Lương huyết", "Chỉ huyết", "Giải độc"],
        "short_desc": "Tiểu kế tác dụng tương tự Đại kế là thanh nhiệt lương huyết, cầm máu tiêu ung. Tuy nhiên Tiểu kế đặc biệt tốt hơn trong việc trị tiểu tiện ra máu (niệu huyết).",
        "price_hint": 150000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Huyết dụ",
        "origin": "Lá phơi khô của cây Huyết dụ (Cordyline fruticosa)",
        "flavors": ["NHAT", "DANG"],
        "property": "LUONG",
        "meridians": ["CAN", "VI"],
        "tags": ["Lương huyết", "Cầm máu", "Tán ứ"],
        "short_desc": "Huyết dụ có tác dụng thanh nhiệt lương huyết, chỉ huyết tán ứ. Hay dùng trị chứng lao phổi ho ra máu, rong kinh, kiết lỵ ra máu và trĩ nội.",
        "price_hint": 110000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Cù mạch",
        "origin": "Toàn cây phơi khô của cây Cù mạch (Dianthus superbus)",
        "flavors": ["DANG"],
        "property": "HAN",
        "meridians": ["TAM", "TIEU_TRANG"],
        "tags": ["Thanh nhiệt", "Lợi thấp", "Phá huyết"],
        "short_desc": "Cù mạch có tác dụng thanh nhiệt lợi thủy, thông lâm, phá huyết thông kinh. Trị đái buốt, đái rắt, đái ra máu và chứng bế kinh ở phụ nữ.",
        "price_hint": 170000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Biển súc",
        "origin": "Toàn cây phơi khô của Rau đắng (Polygonum aviculare)",
        "flavors": ["DANG"],
        "property": "HAN",
        "meridians": ["BANG_QUANG"],
        "tags": ["Thanh nhiệt", "Lợi thủy", "Sát trùng"],
        "short_desc": "Biển súc giúp thanh nhiệt lợi thủy thông lâm, sát trùng chỉ dưỡng. Dùng chữa thấp nhiệt tiểu rắt tiểu buốt, hoàng đản, nhiễm trùng giun sán.",
        "price_hint": 140000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Hải kim sa",
        "origin": "Bào tử phơi khô của cây Bòng bong (Lygodium japonicum)",
        "flavors": ["NGOT", "NHAT"],
        "property": "HAN",
        "meridians": ["BANG_QUANG", "TIEU_TRANG"],
        "tags": ["Thanh nhiệt", "Lợi thấp", "Thông lâm"],
        "short_desc": "Hải kim sa chủ trị thanh nhiệt lợi thấp, thông lâm chỉ thống. Đây là vị thuốc đặc trị dọn dẹp sỏi đường tiết niệu, tiểu buốt, tiểu rắt rất hiệu quả.",
        "price_hint": 350000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    },
    {
        "name": "Chè vằng",
        "origin": "Cành lá phơi khô của cây Chè vằng (Jasminum subtriplinerve)",
        "flavors": ["DANG"],
        "property": "LUONG",
        "meridians": ["TAM", "CAN"],
        "tags": ["Thanh nhiệt", "Giải độc", "Lợi sữa"],
        "short_desc": "Chè vằng có tác dụng thanh nhiệt giải độc, thông huyết mạch, tiêu thũng. Kích thích tiêu hóa và đặc biệt tốt cho phụ nữ sau sinh giúp lợi sữa.",
        "price_hint": 90000,
        "unit": "Gói 500g",
        "review_needed": False,
        "source_note": "Dược điển Việt Nam; Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
    }
]

try:
    with open(r'c:\Users\ngant\OH_web\gen_data\THANH_NHIET.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    data['products'].extend(new_herbs)
    
    with open(r'c:\Users\ngant\OH_web\gen_data\THANH_NHIET.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
except Exception as e:
    print(f"Error updating JSON: {e}")

try:
    with open(r'c:\Users\ngant\OH_web\gen_data\all_existing_herbs.txt', 'a', encoding='utf-8') as f:
        for herb in new_herbs:
            f.write(f"\n{herb['name'].lower()}")
except Exception as e:
    print(f"Error appending txt: {e}")

print("Successfully updated both files!")
