package com.httmdt.orientalherbs.dto.order;

import java.util.List;

import com.httmdt.orientalherbs.model.enums.PaymentMethod;
import com.httmdt.orientalherbs.model.enums.ShippingCarrier;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderRequest {

    @NotNull(message = "Address ID is required")
    private Long addressId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;


    @NotEmpty(message = "Order must have at least one item")
    private List<OrderItemRequest> items;

    private ShippingCarrier shippingCarrier; // Optional - selected by user at checkout
}
