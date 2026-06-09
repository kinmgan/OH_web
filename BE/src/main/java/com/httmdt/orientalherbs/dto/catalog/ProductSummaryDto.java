package com.httmdt.orientalherbs.dto.catalog;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductSummaryDto {
    private Long id;
    private String name;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private BigDecimal finalPrice;
    private BigDecimal discountAmount;
    private Long campaignId;
    private Double rate;
    private Integer soldQuantity;
    private String imageUrl;
}