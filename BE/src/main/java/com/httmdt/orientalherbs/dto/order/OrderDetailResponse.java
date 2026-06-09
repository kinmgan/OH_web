package com.httmdt.orientalherbs.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.httmdt.orientalherbs.model.enums.OrderStatus;
import com.httmdt.orientalherbs.model.enums.PaymentMethod;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderDetailResponse {
    private Long orderId;
    private String orderCode;
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal subtotal;
    private OrderStatus orderStatus;
    private PaymentMethod paymentMethod;
    private LocalDateTime createdAt;
    
    // Địa chỉ giao
    private Long addressId;
    private String recipientName;
    private String recipientPhone;
    private String addressDetail;
    
    
    // Items
    private List<OrderItemDetailResponse> items;
    
    // Shipment
    private ShipmentDetailResponse shipment;
    
    // Payment
    private PaymentDetailResponse payment;
    
    // Return info (nếu có)
    private ReturnDetailResponse returnInfo;
    
    // Refund info (nếu có)
    private RefundDetailResponse refundInfo;
}
