package com.httmdt.orientalherbs.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.httmdt.orientalherbs.model.enums.OrderStatus;
import com.httmdt.orientalherbs.model.enums.PaymentMethod;
import com.httmdt.orientalherbs.model.enums.ShippingCarrier;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderResponse {
    private Long orderId;
    private BigDecimal totalAmount;
    private OrderStatus orderStatus;
    private LocalDateTime createdAt;
    private PaymentMethod paymentMethod;
    private ShippingCarrier shippingCarrier;
}
