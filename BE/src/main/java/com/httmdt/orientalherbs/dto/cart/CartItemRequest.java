package com.httmdt.orientalherbs.dto.cart;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CartItemRequest {
    private Long productVariantId;
    private Integer quantity;
}