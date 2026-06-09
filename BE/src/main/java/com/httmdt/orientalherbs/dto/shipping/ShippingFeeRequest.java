package com.httmdt.orientalherbs.dto.shipping;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ShippingFeeRequest {

    @NotNull(message = "Address ID is required")
    private Long addressId;

    @NotEmpty(message = "Order must have at least one item")
    private List<CartItemRequest> items;

    @Data
    public static class CartItemRequest {
        @NotNull(message = "Product variant ID is required")
        private Long productVariantId;

        @NotNull(message = "Quantity is required")
        private Integer quantity;
    }
}
