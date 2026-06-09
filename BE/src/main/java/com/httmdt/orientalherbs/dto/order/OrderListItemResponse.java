package com.httmdt.orientalherbs.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.httmdt.orientalherbs.model.enums.OrderStatus;
import com.httmdt.orientalherbs.model.enums.PaymentMethod;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderListItemResponse {
    private Long orderId;
    private String orderCode;
    private BigDecimal totalAmount;
    private OrderStatus orderStatus;
    private PaymentMethod paymentMethod;
    private LocalDateTime createdAt;
    private int itemCount;
}
