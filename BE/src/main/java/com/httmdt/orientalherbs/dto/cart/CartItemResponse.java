package com.httmdt.orientalherbs.dto.cart;

import java.math.BigDecimal;

import com.httmdt.orientalherbs.model.enums.DiscountType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CartItemResponse {
    private Long cartItemId;
    private Long productVariantId;
    private String productName;
    private String unitName;
    private String imageUrl;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private BigDecimal finalPrice;
    private BigDecimal discountAmount;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private Long campaignId;
    private String campaignName;
    private Integer quantity;
    private BigDecimal totalPrice;
    private Integer stockQuantity;
}