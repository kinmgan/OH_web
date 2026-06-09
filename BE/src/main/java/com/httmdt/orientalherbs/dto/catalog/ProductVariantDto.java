package com.httmdt.orientalherbs.dto.catalog;

import java.math.BigDecimal;

import com.httmdt.orientalherbs.model.enums.DiscountType;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ProductVariantDto {
    private Long productVariantId;
    private String unitName;
    private BigDecimal price;

    private BigDecimal originalPrice;
    private BigDecimal finalPrice;
    private BigDecimal discountAmount;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private Long campaignId;
    private String campaignName;

    private Integer stockQuantity;
    private Integer weightGram;
    private Integer lengthCm;
    private Integer widthCm;
    private Integer heightCm;
}
