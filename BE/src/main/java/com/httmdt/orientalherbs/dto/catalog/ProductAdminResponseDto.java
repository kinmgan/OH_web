package com.httmdt.orientalherbs.dto.catalog;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import com.httmdt.orientalherbs.model.enums.HerbFlavor;
import com.httmdt.orientalherbs.model.enums.HerbProperty;
import com.httmdt.orientalherbs.model.enums.Meridian;

@Data
@NoArgsConstructor
public class ProductAdminResponseDto {
    private Long id;
    private String name;
    private String sku;
    private String description;
    private String origin;
    private Integer soldQuantity;
    private Double averageRating;
    private BigDecimal minPrice;
    
    private Long categoryId;
    private String categoryName;

    private Set<HerbProperty> properties;
    private Set<HerbFlavor> flavors;
    private Set<Meridian> meridians;
    private List<String> tags;
    
    private LocalDateTime createdAt;
    
    private List<ProductVariantDto> variants;
    private List<ProductImageDto> images;
    private List<String> certificateImages;
}
