package com.httmdt.orientalherbs.controller.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.httmdt.orientalherbs.dto.order.OrderDetailResponse;
import com.httmdt.orientalherbs.dto.order.OrderListItemResponse;
import com.httmdt.orientalherbs.dto.order.OrderRequest;
import com.httmdt.orientalherbs.dto.order.OrderResponse;
import com.httmdt.orientalherbs.model.enums.OrderStatus;
import com.httmdt.orientalherbs.security.user.CustomUserDetails;
import com.httmdt.orientalherbs.service.order.OrderService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * Create a new order
     */
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Validated @RequestBody OrderRequest request) {

        OrderResponse response = orderService.createOrder(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get user's orders with pagination
     */
    @GetMapping
    public ResponseEntity<Page<OrderListItemResponse>> getMyOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<OrderListItemResponse> orders = orderService.getUserOrders(userDetails.getId(), pageable);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get user's orders by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<OrderListItemResponse>> getMyOrdersByStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<OrderListItemResponse> orders = orderService.getUserOrdersByStatus(userDetails.getId(), status, pageable);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get order detail
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDetailResponse> getOrderDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long orderId) {

        OrderDetailResponse order = orderService.getUserOrderDetail(userDetails.getId(), orderId);
        return ResponseEntity.ok(order);
    }

    /**
     * Cancel order (User)
     */
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<OrderDetailResponse> cancelOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long orderId) {

        OrderDetailResponse order = orderService.cancelOrder(userDetails.getId(), orderId);
        return ResponseEntity.ok(order);
    }
}
