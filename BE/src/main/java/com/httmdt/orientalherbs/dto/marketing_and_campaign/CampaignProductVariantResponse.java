package com.httmdt.orientalherbs.dto.marketing_and_campaign;

import java.math.BigDecimal;

import com.httmdt.orientalherbs.model.enums.DiscountType;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class CampaignProductVariantResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Long productVariantId;
    private String unitName;
    private BigDecimal originalPrice;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal discountAmount;
    private BigDecimal finalPrice;
    private Integer displayOrder;
    private String imageUrl;
}
