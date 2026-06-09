package com.httmdt.orientalherbs.dto.order;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderItemDetailResponse {
    private Long itemId;
    private Long productVariantId;
    private Long productId;
    private String productName;
    private String productImage;
    private String variantInfo; // e.g., "500g", "Cái"
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}
