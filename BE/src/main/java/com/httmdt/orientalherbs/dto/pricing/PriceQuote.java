package com.httmdt.orientalherbs.dto.pricing;

import java.math.BigDecimal;

import com.httmdt.orientalherbs.model.enums.DiscountType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceQuote {
    private Long productVariantId;
    private BigDecimal originalPrice;
    private BigDecimal finalPrice;
    private BigDecimal discountAmount;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private Long campaignId;
    private String campaignName;
    private boolean hasDiscount;
}
