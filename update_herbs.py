import json

new_herbs = [
  {
    "name": "Hy Thiêm",
    "origin": "Toàn cây trên mặt đất phơi khô của cây Hy thiêm (Siegesbeckia orientalis L., họ Cúc Asteraceae)",
    "flavors": ["DANG"],
    "property": "HAN",
    "meridians": ["CAN", "THAN"],
    "tags": ["khu_phong_thấp", "thanh_nhiệt_giải_độc", "lợi_gân_cốt", "đau_nhức_xương_khớp"],
    "short_desc": "Khu phong thấp, thông kinh lạc, thanh nhiệt giải độc. Chủ trị phong thấp, tê bại nửa người, nhức xương khớp, gân cốt mềm yếu.",
    "price_hint": 75000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam V; Những cây thuốc và vị thuốc Việt Nam"
  },
  {
    "name": "Dây Gắm",
    "origin": "Thân và rễ phơi khô của cây Gắm (Gnetum montanum Markgr., họ Gắm Gnetaceae)",
    "flavors": ["DANG"],
    "property": "BINH",
    "meridians": ["CAN", "THAN"],
    "tags": ["khu_phong_trừ_thấp", "giải_độc", "tiêu_viêm", "trị_gout"],
    "short_desc": "Khu phong, trừ thấp, tiêu viêm, giải độc, sát trùng. Chủ trị bệnh gout (thống phong), phong thấp đau nhức, rễ trị kinh nguyệt không đều.",
    "price_hint": 90000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Chìa Vôi",
    "origin": "Dây và lá phơi khô của cây Chìa vôi (Cissus modeccoides Planch., họ Nho Vitaceae)",
    "flavors": ["DANG", "NGOT"],
    "property": "LUONG",
    "meridians": ["CAN", "THAN"],
    "tags": ["thông_kinh_lạc", "thanh_nhiệt", "tiêu_độc", "đau_nhức_xương_khớp"],
    "short_desc": "Thanh nhiệt giải độc, tán kết, hành huyết, thông kinh lạc. Chủ trị phong thấp nhức mỏi xương khớp, bong gân, tụ máu sưng nề.",
    "price_hint": 85000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Cốt Khí Củ",
    "origin": "Rễ củ phơi khô của cây Cốt khí củ (Polygonum cuspidatum Sieb. et Zucc., họ Rau răm Polygonaceae)",
    "flavors": ["DANG"],
    "property": "HAN",
    "meridians": ["CAN", "DOM", "PHE"],
    "tags": ["hoạt_huyết", "thông_kinh", "khu_phong_trừ_thấp", "đau_nhức_xương_khớp"],
    "short_desc": "Hoạt huyết thông kinh, chỉ thống, trừ phong thấp, thanh nhiệt giải độc. Chủ trị đau nhức xương khớp do phong thấp, bế kinh, chấn thương.",
    "price_hint": 110000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam V"
  },
  {
    "name": "Phòng Kỷ",
    "origin": "Rễ phơi khô của cây Phấn phòng kỷ (Stephania tetrandra S. Moore, họ Tiết dê Menispermaceae)",
    "flavors": ["DANG", "CAY"],
    "property": "HAN",
    "meridians": ["BANG_QUANG", "THAN", "TY"],
    "tags": ["khử_phong_thấp", "chỉ_thống", "lợi_thủy", "tiêu_thũng"],
    "short_desc": "Khử phong thấp, chỉ thống, lợi thủy tiêu thũng. Chủ trị phong thấp tý thống, phù thũng, cước khí sưng đau.",
    "price_hint": 160000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam V"
  },
  {
    "name": "Xuyên Ô",
    "origin": "Rễ củ mẹ phơi khô của cây Ô đầu (Aconitum carmichaelii Debx., họ Mao lương Ranunculaceae), thường phải qua bào chế.",
    "flavors": ["CAY", "DANG"],
    "property": "NHIET",
    "meridians": ["TAM", "CAN", "THAN", "TY"],
    "tags": ["khử_hàn_thấp", "ôn_kinh_chỉ_thống", "tán_phong_tà"],
    "short_desc": "Khử hàn thấp, tán phong tà, ôn kinh lạc, chỉ thống. Chủ trị phong hàn thấp tỳ, các khớp đau nhức dữ dội, chân tay lạnh, co quắp.",
    "price_hint": 250000,
    "unit": "Gói 500g",
    "review_needed": True,
    "source_note": "Dược điển Việt Nam V"
  },
  {
    "name": "Thảo Ô",
    "origin": "Rễ củ phơi khô của cây Ô đầu hoang (Aconitum kusnezoffii Reichb., họ Mao lương Ranunculaceae)",
    "flavors": ["CAY", "DANG"],
    "property": "NHIET",
    "meridians": ["TAM", "CAN", "TY"],
    "tags": ["khu_phong_trừ_thấp", "ôn_kinh_chỉ_thống", "tán_hàn"],
    "short_desc": "Khứ phong trừ thấp, ôn kinh chỉ thống. Tính chất tương tự Xuyên Ô nhưng mạnh và độc hơn. Chủ trị phong hàn thấp tý, đau nhức xương.",
    "price_hint": 210000,
    "unit": "Gói 500g",
    "review_needed": True,
    "source_note": "Dược điển Việt Nam V"
  },
  {
    "name": "Hải Phong Đằng",
    "origin": "Thân dây phơi khô của cây Hải phong đằng (Piper kadsura (Choisy) Ohwi, họ Hồ tiêu Piperaceae)",
    "flavors": ["CAY", "DANG"],
    "property": "ON",
    "meridians": ["CAN"],
    "tags": ["khu_phong_trừ_thấp", "thông_lạc", "chỉ_thống"],
    "short_desc": "Khu phong trừ thấp, thông lạc chỉ thống. Chủ trị phong thấp tý thống, các khớp co duỗi khó khăn, đau nhức gân cốt.",
    "price_hint": 180000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam V"
  },
  {
    "name": "Thanh Phong Đằng",
    "origin": "Thân dây phơi khô của cây Thanh phong đằng (Sinomenium acutum (Thunb.) Rehd. et Wils., họ Tiết dê Menispermaceae)",
    "flavors": ["CAY", "DANG"],
    "property": "BINH",
    "meridians": ["CAN", "TY"],
    "tags": ["khu_phong_thấp", "thông_kinh_lạc", "lợi_tiểu"],
    "short_desc": "Khu phong thấp, thông kinh lạc, lợi thủy tiêu thũng. Chủ trị phong thấp đau nhức, đau nhức do sưng tấy các khớp, cước khí phù thũng.",
    "price_hint": 175000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam V"
  },
  {
    "name": "Tầm Cốt Phong",
    "origin": "Thân và rễ phơi khô của cây Tầm cốt phong (Aristolochia mandschuriensis Kom., họ Mộc hương Aristolochiaceae)",
    "flavors": ["CAY", "DANG"],
    "property": "BINH",
    "meridians": ["CAN"],
    "tags": ["khứ_phong_thấp", "thông_lạc", "chỉ_thống"],
    "short_desc": "Khứ phong thấp, thông lạc chỉ thống. Chủ trị phong thấp tê đau, đau khớp xương, tứ chi co quắp.",
    "price_hint": 200000,
    "unit": "Gói 500g",
    "review_needed": True,
    "source_note": "Dược điển Việt Nam V"
  },
  {
    "name": "Lão Quan Thảo",
    "origin": "Toàn cây phơi khô của cây Lão quan thảo (Geranium nepalense Sweet., họ Mỏ hạc Geraniaceae)",
    "flavors": ["CAY", "DANG"],
    "property": "BINH",
    "meridians": ["CAN", "THAN"],
    "tags": ["khứ_phong_thấp", "thông_kinh_lạc", "thanh_nhiệt"],
    "short_desc": "Khứ phong thấp, thông kinh lạc, thanh nhiệt giải độc. Chủ trị phong thấp tê đau, sưng đau khớp, gân cốt tê mỏi.",
    "price_hint": 130000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Từ điển Cây thuốc Việt Nam"
  },
  {
    "name": "Tùng Tiết",
    "origin": "Đoạn mấu hoặc đốt cành phơi khô của cây Thông (Pinus massoniana Lamb., họ Thông Pinaceae)",
    "flavors": ["CAY", "DANG"],
    "property": "ON",
    "meridians": ["CAN", "THAN"],
    "tags": ["khu_phong_táo_thấp", "thư_cân_hoạt_lạc", "chỉ_thống"],
    "short_desc": "Khu phong táo thấp, thư cân hoạt lạc chỉ thống. Chủ trị phong hàn thấp tý, đau nhức gân cốt, trật đả sưng đau.",
    "price_hint": 60000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Những cây thuốc và vị thuốc Việt Nam (Đỗ Tất Lợi)"
  },
  {
    "name": "Mộc Thông",
    "origin": "Thân leo phơi khô của cây Mộc thông (Akebia quinata (Thunb.) Decne, họ Mộc thông Lardizabalaceae)",
    "flavors": ["DANG"],
    "property": "HAN",
    "meridians": ["TAM", "TIEU_TRANG", "BANG_QUANG"],
    "tags": ["thanh_nhiệt", "lợi_thủy", "thông_kinh_mạch", "đau_nhức_xương_khớp"],
    "short_desc": "Thanh tâm hỏa, lợi tiểu tiện, thông huyết mạch. Hay dùng làm thuốc dẫn thông kinh lạc trị tê thấp, bế kinh.",
    "price_hint": 120000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam V"
  },
  {
    "name": "Bá Bệnh",
    "origin": "Rễ và vỏ thân phơi khô của cây Bá bệnh / Mật nhân (Eurycoma longifolia Jack, họ Thanh thất Simaroubaceae)",
    "flavors": ["DANG"],
    "property": "LUONG",
    "meridians": ["CAN", "THAN"],
    "tags": ["thanh_nhiệt", "tiêu_thũng", "lợi_thấp", "đau_lưng_nhức_mỏi"],
    "short_desc": "Thanh nhiệt, tiêu thũng, lợi thấp. Trị phong thấp, nhức mỏi gân xương, đau lưng, khó tiêu, chức năng sinh lý kém.",
    "price_hint": 220000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam V"
  },
  {
    "name": "Đơn Châu Chấu",
    "origin": "Rễ phơi khô của cây Đơn châu chấu (Aralia armata (Wall.) Seem., họ Ngũ gia bì Araliaceae)",
    "flavors": ["CAY", "DANG"],
    "property": "ON",
    "meridians": ["CAN"],
    "tags": ["thanh_nhiệt_giải_độc", "khu_phong_trừ_thấp", "tán_ứ_chỉ_thống"],
    "short_desc": "Thanh nhiệt giải độc, khu phong trừ thấp, tán ứ chỉ thống. Chủ trị phong thấp sưng đau các khớp, viêm họng, bạch hầu.",
    "price_hint": 140000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Từ điển Cây thuốc Việt Nam"
  },
  {
    "name": "Bưởi Bung",
    "origin": "Rễ phơi khô của cây Bưởi bung (Acronychia pedunculata (L.) Miq., họ Cam Rutaceae)",
    "flavors": ["CAY", "DANG"],
    "property": "ON",
    "meridians": ["CAN", "PHE", "TY"],
    "tags": ["tán_ứ", "thông_kinh_lạc", "trừ_phong_thấp", "đau_nhức_xương_khớp"],
    "short_desc": "Tán ứ, thông kinh lạc, trừ phong thấp, giảm đau nhức. Chủ trị phong tê thấp, khớp xương sưng đau, đau dạ dày.",
    "price_hint": 105000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Từ điển Cây thuốc Việt Nam"
  },
  {
    "name": "Địa Liền",
    "origin": "Thân rễ (củ) phơi hay sấy khô của cây Địa liền (Kaempferia galanga L., họ Gừng Zingiberaceae)",
    "flavors": ["CAY"],
    "property": "ON",
    "meridians": ["TY", "VI"],
    "tags": ["ôn_trung_tán_hàn", "trừ_thấp", "tịch_uế", "đau_nhức_xương_khớp"],
    "short_desc": "Ôn trung, tán hàn, trừ thấp, giảm đau. Chủ trị ngực bụng lạnh đau, tiêu chảy, ngâm rượu xoa bóp trị phong thấp tê đau.",
    "price_hint": 125000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam V"
  },
  {
    "name": "Mã Tiền",
    "origin": "Hạt khô đã qua bào chế cẩn thận của cây Mã tiền (Strychnos nux-vomica L., họ Mã tiền Loganiaceae)",
    "flavors": ["DANG"],
    "property": "HAN",
    "meridians": ["CAN", "TY"],
    "tags": ["thông_lạc_chỉ_thống", "tán_kết_tiêu_thũng", "trị_phong_thấp"],
    "short_desc": "Thông lạc chỉ thống, tán kết tiêu thũng. Chủ trị phong thấp ngoan tý, đau nhức xương tủy dữ dội, di chứng bại liệt. Rất độc.",
    "price_hint": 350000,
    "unit": "Gói 500g (Chế)",
    "review_needed": True,
    "source_note": "Dược điển Việt Nam V"
  },
  {
    "name": "Ngũ Trảo",
    "origin": "Lá và rễ phơi khô của cây Ngũ trảo (Vitex negundo L., họ Cỏ roi ngựa Verbenaceae)",
    "flavors": ["CAY", "DANG"],
    "property": "ON",
    "meridians": ["PHE", "CAN", "VI"],
    "tags": ["thanh_nhiệt", "khu_phong_thấp", "chỉ_thống"],
    "short_desc": "Thanh nhiệt, khu phong thấp, chỉ thống. Chủ trị cảm mạo phong hàn, đau nhức khớp xương do phong thấp, bong gân.",
    "price_hint": 80000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Từ điển Cây thuốc Việt Nam"
  },
  {
    "name": "Xú Ngô Đồng",
    "origin": "Lá hoặc thân cành non phơi khô của cây Xú ngô đồng / Mò đỏ (Clerodendrum trichotomum Thunb., họ Cỏ roi ngựa Verbenaceae)",
    "flavors": ["DANG", "CAY"],
    "property": "LUONG",
    "meridians": ["CAN", "DOM"],
    "tags": ["khứ_phong_thấp", "bình_can_hạ_áp", "đau_nhức_xương_khớp"],
    "short_desc": "Khứ phong thấp, thanh nhiệt, bình can, hạ huyết áp. Chủ trị phong thấp tý thống, bán thân bất toại, huyết áp cao gây choáng váng.",
    "price_hint": 95000,
    "unit": "Gói 500g",
    "review_needed": False,
    "source_note": "Dược điển Việt Nam V"
  }
]

file_path = "c:/Users/ngant/OH_web/gen_data/XUONG_KHOP.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

data["products"].extend(new_herbs)

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

txt_path = "c:/Users/ngant/OH_web/gen_data/all_existing_herbs.txt"
with open(txt_path, "a", encoding="utf-8") as f:
    for h in new_herbs:
        f.write("\n" + h["name"].lower())

print("Successfully updated XUONG_KHOP.json and all_existing_herbs.txt")
