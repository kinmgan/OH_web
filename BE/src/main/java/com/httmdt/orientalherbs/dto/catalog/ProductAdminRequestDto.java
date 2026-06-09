package com.httmdt.orientalherbs.dto.catalog;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import com.httmdt.orientalherbs.model.enums.HerbFlavor;
import com.httmdt.orientalherbs.model.enums.HerbProperty;
import com.httmdt.orientalherbs.model.enums.Meridian;

@Data
@NoArgsConstructor
public class ProductAdminRequestDto {
    private String name;
    private String sku;
    private String description;
    private String origin;
    private BigDecimal minPrice;
    private Long categoryId;
    
    private Set<HerbProperty> properties;
    private Set<HerbFlavor> flavors;
    private Set<Meridian> meridians;
    private List<String> tags;
    
    private List<ProductVariantDto> variants;
    
    // Khi update, danh sách id ảnh cần giữ lại (không xoá khỏi cloudinary)
    private List<String> keepImagePublicIds;
    
    // Identifier cho ảnh mặc định (VD: public_id của ảnh cũ, hoặc "new_0", "new_1" cho ảnh mới)
    private String defaultImageIdentifier;

    // Khi update, danh sách URL/public_id ảnh giấy chứng nhận cần giữ lại
    private List<String> keepCertificateImages;
}
