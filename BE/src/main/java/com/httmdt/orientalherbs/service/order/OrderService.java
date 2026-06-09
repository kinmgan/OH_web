package com.httmdt.orientalherbs.service.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.httmdt.orientalherbs.dto.order.OrderDetailResponse;
import com.httmdt.orientalherbs.dto.order.OrderListItemResponse;
import com.httmdt.orientalherbs.dto.order.OrderRequest;
import com.httmdt.orientalherbs.dto.order.OrderResponse;
import com.httmdt.orientalherbs.model.enums.OrderStatus;

public interface OrderService {
    // Create order
    OrderResponse createOrder(Long userId, OrderRequest request);

    // Get orders for user
    Page<OrderListItemResponse> getUserOrders(Long userId, Pageable pageable);
    Page<OrderListItemResponse> getUserOrdersByStatus(Long userId, OrderStatus status, Pageable pageable);

    // Get order detail for user
    OrderDetailResponse getUserOrderDetail(Long userId, Long orderId);

    // Get all orders (admin)
    Page<OrderListItemResponse> getAllOrders(Pageable pageable);
    Page<OrderListItemResponse> getOrdersByStatus(OrderStatus status, Pageable pageable);

    // Get order detail (admin)
    OrderDetailResponse getOrderDetail(Long orderId);

    // Update order status (admin)
    OrderDetailResponse updateOrderStatus(Long orderId, OrderStatus newStatus);

    // Cancel order (user)
    OrderDetailResponse cancelOrder(Long userId, Long orderId);
}
