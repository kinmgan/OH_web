package com.httmdt.orientalherbs.mapper.order;

import org.springframework.stereotype.Component;

import com.httmdt.orientalherbs.dto.order.OrderDetailResponse;
import com.httmdt.orientalherbs.dto.order.OrderItemDetailResponse;
import com.httmdt.orientalherbs.dto.order.OrderListItemResponse;
import com.httmdt.orientalherbs.dto.order.PaymentDetailResponse;
import com.httmdt.orientalherbs.dto.order.ShipmentDetailResponse;
import com.httmdt.orientalherbs.dto.order.TrackingHistoryEntry;
import com.httmdt.orientalherbs.model.order.Order;
import com.httmdt.orientalherbs.model.order.OrderItem;
import com.httmdt.orientalherbs.model.order.Payment;
import com.httmdt.orientalherbs.model.order.Shipment;
import com.httmdt.orientalherbs.model.order.ShipmentTrackingHistory;

import java.util.List;

@Component
public class OrderMapper {

    public OrderListItemResponse toListItemResponse(Order order) {
        if (order == null) {
            return null;
        }

        return OrderListItemResponse.builder()
            .orderId(order.getOrder_id())
            .orderCode("ORD-" + String.format("%06d", order.getOrder_id()))
            .totalAmount(order.getTotalAmount())
            .orderStatus(order.getOrderStatus())
            .paymentMethod(order.getPayment() != null ? order.getPayment().getPaymentMethod() : null)
            .createdAt(order.getCreatedAt())
            .itemCount(order.getOrderItems() != null ? 
                order.getOrderItems().stream().mapToInt(OrderItem::getQuantity).sum() : 0)
            .build();
    }

    public OrderDetailResponse toDetailResponse(Order order) {
        if (order == null) {
            return null;
        }

        java.math.BigDecimal calculatedSubtotal = order.getSubtotal();
        if (calculatedSubtotal == null && order.getOrderItems() != null) {
            calculatedSubtotal = order.getOrderItems().stream()
                .map(item -> item.getUnitPrice().multiply(new java.math.BigDecimal(item.getQuantity())))
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        }

        java.math.BigDecimal calculatedDiscount = order.getDiscountAmount();
        if (calculatedDiscount == null && calculatedSubtotal != null && order.getTotalAmount() != null) {
             calculatedDiscount = calculatedSubtotal.subtract(order.getTotalAmount());
             if (calculatedDiscount.compareTo(java.math.BigDecimal.ZERO) < 0) {
                 calculatedDiscount = java.math.BigDecimal.ZERO;
             }
        }

        return OrderDetailResponse.builder()
            .orderId(order.getOrder_id())
            .orderCode("ORD-" + String.format("%06d", order.getOrder_id()))
            .totalAmount(order.getTotalAmount())
            .orderStatus(order.getOrderStatus())
            .paymentMethod(order.getPayment() != null ? order.getPayment().getPaymentMethod() : null)
            .createdAt(order.getCreatedAt())
            .subtotal(calculatedSubtotal)
            .shippingFee(order.getShippingFee() != null ? order.getShippingFee() : java.math.BigDecimal.ZERO)
            .discountAmount(calculatedDiscount)
            .addressId(order.getAddressId())
            .recipientName(order.getRecipientName())
            .recipientPhone(order.getRecipientPhone())
            .addressDetail(order.getAddressDetail())
            .items(order.getOrderItems() != null ?
                order.getOrderItems().stream().map(this::toItemDetailResponse).toList() : null)
            .shipment(getMockOrRealShipment(order))
            .payment(order.getPayment() != null ? toPaymentDetailResponse(order.getPayment()) : null)
            .build();
    }

    public OrderItemDetailResponse toItemDetailResponse(OrderItem item) {
        if (item == null) {
            return null;
        }

        String productImageUrl = null;
        Long productId = null;
        if (item.getProductVariant() != null && item.getProductVariant().getProduct() != null) {
            var product = item.getProductVariant().getProduct();
            productId = product.getId();
            if (product.getImages() != null) {
                java.util.List<com.httmdt.orientalherbs.model.catalog.ProductImage> images = product.getImages();
                productImageUrl = images.stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsDefault()))
                    .map(com.httmdt.orientalherbs.model.catalog.ProductImage::getProductImageUrl)
                    .findFirst()
                    .orElse(images.isEmpty() ? null : images.get(0).getProductImageUrl());
            }
        }

        return OrderItemDetailResponse.builder()
            .itemId(item.getId())
            .productVariantId(item.getProductVariant().getProductVariantId())
            .productId(productId)
            .productName(item.getProductVariant().getProduct().getName())
            .productImage(productImageUrl)
            .variantInfo(item.getProductVariant().getUnitName())
            .quantity(item.getQuantity())
            .unitPrice(item.getUnitPrice())
            .totalPrice(item.getUnitPrice().multiply(new java.math.BigDecimal(item.getQuantity())))
            .build();
    }

    public ShipmentDetailResponse toShipmentDetailResponse(Shipment shipment) {
        if (shipment == null) {
            return null;
        }

        List<TrackingHistoryEntry> histories = null;
        if (shipment.getTrackingHistories() != null && !shipment.getTrackingHistories().isEmpty()) {
            histories = shipment.getTrackingHistories().stream()
                .map(this::toTrackingHistoryEntry)
                .toList();
        }

        return ShipmentDetailResponse.builder()
            .shipmentId(shipment.getId())
            .carrierCode(shipment.getCarrierCode() != null ? shipment.getCarrierCode().name() : null)
            .carrierName(shipment.getCarrierName())
            .carrierOrderId(shipment.getCarrierOrderId())
            .trackingNumber(shipment.getTrackingNumber())
            .shipmentStatus(shipment.getShipmentStatus() != null ? shipment.getShipmentStatus().name() : null)
            .shippingFee(shipment.getShippingFee())
            .codAmount(shipment.getCodAmount())
            .estimatedDeliveryDate(shipment.getEstimatedDeliveryDate())
            .actualDeliveryDate(shipment.getActualDeliveryDate())
            .trackingHistories(histories)
            .build();
    }

    private TrackingHistoryEntry toTrackingHistoryEntry(ShipmentTrackingHistory history) {
        return TrackingHistoryEntry.builder()
            .statusDescription(history.getStatusDescription())
            .location(history.getLocation())
            .updatedAt(history.getUpdatedAt())
            .build();
    }

    private ShipmentDetailResponse getMockOrRealShipment(Order order) {
        if (order.getShipment() != null) {
            return toShipmentDetailResponse(order.getShipment());
        }
        
        if (order.getShippingCarrier() == null) {
            return null;
        }
        
        String carrierName = switch (order.getShippingCarrier()) {
            case GHN -> "Giao Hàng Nhanh (GHN)";
            case GHTK -> "Giao Hàng Tiết Kiệm (GHTK)";
            case VNPOST -> "Vietnam Post";
            default -> order.getShippingCarrier().name();
        };

        String mockStatus = switch (order.getOrderStatus()) {
            case PENDING, CONFIRMED -> "PENDING";
            case SHIPPING -> "IN_TRANSIT";
            case DELIVERED -> "DELIVERED";
            case RETURNED -> "RETURNED";
            case CANCELLED -> "CANCELLED";
            default -> "PENDING";
        };

        return ShipmentDetailResponse.builder()
            .carrierCode(order.getShippingCarrier().name())
            .carrierName(carrierName)
            .shipmentStatus(mockStatus)
            .shippingFee(order.getShippingFee())
            .build();
    }

    public PaymentDetailResponse toPaymentDetailResponse(Payment payment) {
        if (payment == null) {
            return null;
        }

        return PaymentDetailResponse.builder()
            .paymentId(payment.getId())
            .status(payment.getPaymentStatus() != null ? payment.getPaymentStatus().toString() : "PENDING")
            .paidAt(payment.getPaidAt())
            .build();
    }
}
