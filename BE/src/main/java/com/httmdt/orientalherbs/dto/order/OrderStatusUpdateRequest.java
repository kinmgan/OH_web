package com.httmdt.orientalherbs.dto.order;

import com.httmdt.orientalherbs.model.enums.OrderStatus;

import lombok.Data;

@Data
public class OrderStatusUpdateRequest {
    private OrderStatus status;
}
