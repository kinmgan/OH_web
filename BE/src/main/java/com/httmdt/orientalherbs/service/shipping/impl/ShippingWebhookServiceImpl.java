package com.httmdt.orientalherbs.service.shipping.impl;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.httmdt.orientalherbs.dao.order.OrderRepository;
import com.httmdt.orientalherbs.dao.order.ShipmentRepository;
import com.httmdt.orientalherbs.model.enums.OrderStatus;
import com.httmdt.orientalherbs.model.enums.ShipmentStatus;
import com.httmdt.orientalherbs.model.order.Order;
import com.httmdt.orientalherbs.model.order.Shipment;
import com.httmdt.orientalherbs.service.shipping.ShippingWebhookService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShippingWebhookServiceImpl implements ShippingWebhookService {

    private final ShipmentRepository shipmentRepository;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void processGhnWebhook(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            
            // Lấy data từ trường "data" nếu có (có thể do API Gateway bọc), nếu không thì lấy thẳng từ root (chuẩn webhook GHN)
            JsonNode data = root.has("data") ? root.get("data") : root;
            
            if (data == null) {
                log.warn("GHN webhook: No data found in payload");
                return;
            }

            // GHN Webhook chuẩn trả về OrderCode và Status (viết hoa chữ đầu), nhưng để an toàn ta check cả snake_case
            String orderCode = data.has("OrderCode") ? data.get("OrderCode").asText() : 
                              (data.has("order_code") ? data.get("order_code").asText() : null);
                              
            String statusCode = data.has("Status") ? data.get("Status").asText() : 
                               (data.has("status_code") ? data.get("status_code").asText() : null);
                               
            String statusName = data.has("StatusName") ? data.get("StatusName").asText() : 
                               (data.has("status_name") ? data.get("status_name").asText() : null);

            if (orderCode == null) {
                log.warn("GHN webhook: No order_code found");
                return;
            }

            // Find shipment by carrier order ID
            Shipment shipment = shipmentRepository.findByCarrierOrderId(orderCode)
                    .orElse(null);

            if (shipment == null) {
                log.warn("GHN webhook: Shipment not found for order_code: {}", orderCode);
                return;
            }

            // Map GHN status code to our status
            ShipmentStatus newStatus = mapGhnStatus(statusCode);
            
            // Update shipment status
            if (newStatus != shipment.getShipmentStatus()) {
                shipment.setShipmentStatus(newStatus);
                
                // Add tracking history
                String description = statusName != null ? statusName : "Cập nhật từ GHN";
                addTrackingHistory(shipment, description, "GHN");

                // If delivered, update order status
                if (newStatus == ShipmentStatus.DELIVERED) {
                    shipment.setActualDeliveryDate(LocalDateTime.now());
                    updateOrderStatus(shipment, OrderStatus.DELIVERED);
                } else if (newStatus == ShipmentStatus.RETURNED) {
                    updateOrderStatus(shipment, OrderStatus.RETURNED);
                }

                shipmentRepository.save(shipment);
                log.info("GHN webhook: Updated shipment {} to status {}", shipment.getId(), newStatus);
            }

        } catch (Exception e) {
            log.error("Error processing GHN webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process GHN webhook", e);
        }
    }

    @Override
    @Transactional
    public void processGhtkWebhook(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            JsonNode data = root.get("data");
            
            if (data == null) {
                log.warn("GHTK webhook: No data field found");
                return;
            }

            String orderId = data.has("label_id") ? data.get("label_id").asText() : null;
            String status = data.has("status") ? data.get("status").asText() : null;
            String statusText = data.has("status_text") ? data.get("status_text").asText() : null;

            if (orderId == null) {
                log.warn("GHTK webhook: No label_id found");
                return;
            }

            Shipment shipment = shipmentRepository.findByCarrierOrderId(orderId)
                    .orElse(null);

            if (shipment == null) {
                log.warn("GHTK webhook: Shipment not found for label_id: {}", orderId);
                return;
            }

            ShipmentStatus newStatus = mapGhtkStatus(status);
            
            if (newStatus != shipment.getShipmentStatus()) {
                shipment.setShipmentStatus(newStatus);
                
                String description = statusText != null ? statusText : "Cập nhật từ GHTK";
                addTrackingHistory(shipment, description, "GHTK");

                if (newStatus == ShipmentStatus.DELIVERED) {
                    shipment.setActualDeliveryDate(LocalDateTime.now());
                    updateOrderStatus(shipment, OrderStatus.DELIVERED);
                } else if (newStatus == ShipmentStatus.RETURNED) {
                    updateOrderStatus(shipment, OrderStatus.RETURNED);
                }

                shipmentRepository.save(shipment);
                log.info("GHTK webhook: Updated shipment {} to status {}", shipment.getId(), newStatus);
            }

        } catch (Exception e) {
            log.error("Error processing GHTK webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process GHTK webhook", e);
        }
    }

    @Override
    @Transactional
    public void processVnpostWebhook(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            JsonNode data = root.get("data");
            
            if (data == null) {
                log.warn("VNPOST webhook: No data field found");
                return;
            }

            String trackingNumber = data.has("tracking_number") ? data.get("tracking_number").asText() : null;
            String status = data.has("status_code") ? data.get("status_code").asText() : null;
            String statusText = data.has("status_description") ? data.get("status_description").asText() : null;

            if (trackingNumber == null) {
                log.warn("VNPOST webhook: No tracking_number found");
                return;
            }

            Shipment shipment = shipmentRepository.findByTrackingNumber(trackingNumber)
                    .orElse(null);

            if (shipment == null) {
                log.warn("VNPOST webhook: Shipment not found for tracking_number: {}", trackingNumber);
                return;
            }

            ShipmentStatus newStatus = mapVnpostStatus(status);
            
            if (newStatus != shipment.getShipmentStatus()) {
                shipment.setShipmentStatus(newStatus);
                
                String description = statusText != null ? statusText : "Cập nhật từ VNPOST";
                addTrackingHistory(shipment, description, "VNPOST");

                if (newStatus == ShipmentStatus.DELIVERED) {
                    shipment.setActualDeliveryDate(LocalDateTime.now());
                    updateOrderStatus(shipment, OrderStatus.DELIVERED);
                } else if (newStatus == ShipmentStatus.RETURNED) {
                    updateOrderStatus(shipment, OrderStatus.RETURNED);
                }

                shipmentRepository.save(shipment);
                log.info("VNPOST webhook: Updated shipment {} to status {}", shipment.getId(), newStatus);
            }

        } catch (Exception e) {
            log.error("Error processing VNPOST webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process VNPOST webhook", e);
        }
    }

    private ShipmentStatus mapGhnStatus(String statusCode) {
        if (statusCode == null) return ShipmentStatus.PENDING;

        return switch (statusCode) {
            case "ready_to_pick", "picking" -> ShipmentStatus.PICKED_UP;
            case "in_transit" -> ShipmentStatus.IN_TRANSIT;
            case "delivered" -> ShipmentStatus.DELIVERED;
            case "return" -> ShipmentStatus.RETURNED;
            case "cancelled" -> ShipmentStatus.PENDING; // GHN cancelled -> we keep as pending or add CANCELLED enum
            default -> ShipmentStatus.IN_TRANSIT;
        };
    }

    private ShipmentStatus mapGhtkStatus(String status) {
        if (status == null) return ShipmentStatus.PENDING;

        return switch (status) {
            case "2" -> ShipmentStatus.PICKED_UP; // Đang lấy hàng
            case "3", "4" -> ShipmentStatus.IN_TRANSIT; // Đang vận chuyển
            case "5" -> ShipmentStatus.DELIVERED; // Đã giao
            case "6", "7", "8" -> ShipmentStatus.RETURNED; // Hoàn hàng
            case "-1" -> ShipmentStatus.PENDING; // Hủy -> no CANCELLED
            default -> ShipmentStatus.IN_TRANSIT;
        };
    }

    private ShipmentStatus mapVnpostStatus(String statusCode) {
        if (statusCode == null) return ShipmentStatus.PENDING;

        return switch (statusCode) {
            case "LK01", "LK02" -> ShipmentStatus.PICKED_UP;
            case "NK01", "NK02", "DV01", "DV02" -> ShipmentStatus.IN_TRANSIT;
            case "TH01", "TH02" -> ShipmentStatus.DELIVERED;
            case "K02" -> ShipmentStatus.RETURNED;
            default -> ShipmentStatus.IN_TRANSIT;
        };
    }

    private void addTrackingHistory(Shipment shipment, String description, String location) {
        com.httmdt.orientalherbs.model.order.ShipmentTrackingHistory history = 
            new com.httmdt.orientalherbs.model.order.ShipmentTrackingHistory();
        history.setShipment(shipment);
        history.setStatusDescription(description);
        history.setLocation(location);
        shipment.getTrackingHistories().add(history);
    }

    private void updateOrderStatus(Shipment shipment, OrderStatus newStatus) {
        Order order = shipment.getOrder();
        if (order != null && order.getOrderStatus() != OrderStatus.CANCELLED) {
            order.setOrderStatus(newStatus);
            orderRepository.save(order);
            log.info("Updated order {} status to {}", order.getOrder_id(), newStatus);
        }
    }
}
