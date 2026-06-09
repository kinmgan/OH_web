package com.httmdt.orientalherbs.dto.catalog;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ProductImageDto {
    private Long id;
    private String productImageUrl;
    private String imagePublicId;
    private Boolean isDefault;
}
