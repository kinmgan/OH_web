package com.httmdt.orientalherbs.service.shipping.impl;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.httmdt.orientalherbs.dao.WarehouseConfigRepository;
import com.httmdt.orientalherbs.dao.order.OrderRepository;
import com.httmdt.orientalherbs.dao.order.ShipmentRepository;
import com.httmdt.orientalherbs.dao.order.ShipmentTrackingHistoryRepository;
import com.httmdt.orientalherbs.dao.user.UserAddressRepository;
import com.httmdt.orientalherbs.dto.order.TrackingHistoryEntry;
import com.httmdt.orientalherbs.model.WarehouseConfig;
import com.httmdt.orientalherbs.model.enums.OrderStatus;
import com.httmdt.orientalherbs.model.enums.ShipmentStatus;
import com.httmdt.orientalherbs.model.order.Order;
import com.httmdt.orientalherbs.model.order.Shipment;
import com.httmdt.orientalherbs.model.order.ShipmentTrackingHistory;
import com.httmdt.orientalherbs.model.user.UserAddress;
import com.httmdt.orientalherbs.service.shipping.ShipmentService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final OrderRepository orderRepository;
    private final UserAddressRepository userAddressRepository;
    private final WarehouseConfigRepository warehouseConfigRepository;
    private final ShipmentTrackingHistoryRepository trackingHistoryRepository;
    private final ObjectMapper objectMapper;

    @Value("${GHN_TOKEN:}")
    private String ghnToken;

    @Value("${GHN_SHOP_ID:}")
    private String ghnShopId;

    private static final String GHN_API_URL = "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create";

    @Override
    @Transactional
    public Shipment createShipment(Long orderId) {
        // Check if shipment already exists
        if (shipmentRepository.existsByOrderId(orderId)) {
            throw new RuntimeException("Shipment already exists for order: " + orderId);
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (order.getShippingCarrier() == null) {
            throw new RuntimeException("No shipping carrier specified for order: " + orderId);
        }

        // Get warehouse config
        WarehouseConfig warehouse = warehouseConfigRepository.findByIsActiveTrue()
                .orElseThrow(() -> new RuntimeException("No active warehouse configured"));

        // Get destination address
        UserAddress address = userAddressRepository.findById(order.getAddressId())
                .orElseThrow(() -> new RuntimeException("Address not found for order: " + orderId));

        // Create shipment entity
        Shipment shipment = new Shipment();
        shipment.setOrder(order);
        shipment.setCarrierCode(order.getShippingCarrier());
        shipment.setShippingFee(order.getShippingFee());
        shipment.setCodAmount(order.getCodAmount());
        shipment.setShipmentStatus(ShipmentStatus.PENDING);

        String carrierName = switch (order.getShippingCarrier()) {
            case GHN -> "Giao Hàng Nhanh";
            case GHTK -> "Giao Hàng Tiết Kiệm";
            case VNPOST -> "Vietnam Post";
        };
        shipment.setCarrierName(carrierName);

        // Create shipment with carrier
        switch (order.getShippingCarrier()) {
            case GHN -> createGhnShipment(shipment, warehouse, address, order);
            case GHTK -> createGhtkShipment(shipment, address, order);
            case VNPOST -> createVnpostShipment(shipment, address, order);
        }

        Shipment savedShipment = shipmentRepository.save(shipment);

        // Add initial tracking history
        addTrackingHistory(savedShipment.getId(), "Da tao van don tai " + carrierName, warehouse.getDetailedAddress());

        // Update order status to SHIPPING
        order.setOrderStatus(OrderStatus.SHIPPING);
        orderRepository.save(order);

        return savedShipment;
    }

    private void createGhnShipment(Shipment shipment, WarehouseConfig warehouse, UserAddress address, Order order) throws RuntimeException {
        if (ghnToken == null || ghnToken.isEmpty() || ghnShopId == null || ghnShopId.isEmpty()) {
            // Mock response if no token
            shipment.setCarrierOrderId("GHN-MOCK-" + System.currentTimeMillis());
            shipment.setTrackingNumber("GHN-MOCK-TRACK-" + System.currentTimeMillis());
            shipment.setEstimatedDeliveryDate(LocalDateTime.now().plusDays(3));
            shipment.setShipmentStatus(ShipmentStatus.CREATED);
            shipment.setRawCarrierResponse("{\"mock\": true, \"reason\": \"No GHN token configured\"}");
            return;
        }

        try {
            String jsonPayload = buildGhnPayload(warehouse, address, order);
            
            HttpURLConnection conn = (HttpURLConnection) new URL(GHN_API_URL).openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Token", ghnToken);
            conn.setRequestProperty("ShopId", ghnShopId);
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonPayload.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = conn.getResponseCode();
            StringBuilder response = new StringBuilder();
            
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(
                            responseCode >= 400 ? conn.getErrorStream() : conn.getInputStream(), 
                            StandardCharsets.UTF_8))) {
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
            }

            if (responseCode == 200) {
                JsonNode root = objectMapper.readTree(response.toString());
                JsonNode data = root.get("data");
                
                if (data != null) {
                    shipment.setCarrierOrderId(data.has("order_code") ? data.get("order_code").asText() : null);
                    shipment.setTrackingNumber(data.has("tracking_number") ? data.get("tracking_number").asText() : null);
                    
                    if (data.has("expected_delivery_time")) {
                        String deliveryTime = data.get("expected_delivery_time").asText();
                        // Parse GHN timestamp format
                        try {
                            LocalDateTime delivery = LocalDateTime.parse(deliveryTime.substring(0, 19));
                            shipment.setEstimatedDeliveryDate(delivery);
                        } catch (Exception e) {
                            shipment.setEstimatedDeliveryDate(LocalDateTime.now().plusDays(3));
                        }
                    } else {
                        shipment.setEstimatedDeliveryDate(LocalDateTime.now().plusDays(3));
                    }
                    
                    shipment.setShipmentStatus(ShipmentStatus.CREATED);
                }
            } else {
                throw new RuntimeException("GHN API error: " + responseCode + " - " + response);
            }
            
            shipment.setRawCarrierResponse(response.toString());
            
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            shipment.setCarrierOrderId("GHN-ERR-" + System.currentTimeMillis());
            shipment.setTrackingNumber("GHN-ERR-TRACK-" + System.currentTimeMillis());
            shipment.setEstimatedDeliveryDate(LocalDateTime.now().plusDays(3));
            shipment.setShipmentStatus(ShipmentStatus.CREATED);
            shipment.setRawCarrierResponse("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    private String buildGhnPayload(WarehouseConfig warehouse, UserAddress address, Order order) throws Exception {
        String toAddress = address.getDetailedAddress() + ", " + address.getWardName();
        
        return String.format("""
            {
                "shop_id": %s,
                "from_district_id": %d,
                "to_district_id": %d,
                "to_ward_code": "%s",
                "to_address": "%s",
                "to_name": "%s",
                "to_phone": "%s",
                "cod_amount": %s,
                "content": "Don hang #%d",
                "weight": 500,
                "length": 20,
                "width": 15,
                "height": 10,
                "required_note": "KHONGCHOXEMHANG",
                "payment_type_id": 1,
                "service_type_id": 2,
                "items": [
                    {
                        "name": "Sản phẩm thảo mộc",
                        "quantity": 1,
                        "weight": 500
                    }
                ]
            }
            """,
                ghnShopId,
                warehouse.getDistrictId() != null ? warehouse.getDistrictId() : 0,
                address.getDistrictId() != null ? address.getDistrictId() : 0,
                address.getWardCode() != null ? address.getWardCode() : "",
                escapeJson(toAddress),
                escapeJson(order.getRecipientName()),
                escapeJson(order.getRecipientPhone()),
                order.getCodAmount() != null ? String.valueOf(order.getCodAmount().longValue()) : "0",
                order.getOrder_id()
        );
    }

    private void createGhtkShipment(Shipment shipment, UserAddress address, Order order) {
        // GHTK integration - mock for now
        shipment.setCarrierOrderId("GHTK-MOCK-" + System.currentTimeMillis());
        shipment.setTrackingNumber("GHTK-MOCK-TRACK-" + System.currentTimeMillis());
        shipment.setEstimatedDeliveryDate(LocalDateTime.now().plusDays(4));
        shipment.setShipmentStatus(ShipmentStatus.CREATED);
        shipment.setRawCarrierResponse("{\"mock\": true, \"carrier\": \"GHTK\", \"reason\": \"GHTK integration pending\"}");
    }

    private void createVnpostShipment(Shipment shipment, UserAddress address, Order order) {
        // VNPost integration - mock for now
        shipment.setCarrierOrderId("VNPOST-MOCK-" + System.currentTimeMillis());
        shipment.setTrackingNumber("VNPOST-MOCK-TRACK-" + System.currentTimeMillis());
        shipment.setEstimatedDeliveryDate(LocalDateTime.now().plusDays(5));
        shipment.setShipmentStatus(ShipmentStatus.CREATED);
        shipment.setRawCarrierResponse("{\"mock\": true, \"carrier\": \"VNPOST\", \"reason\": \"VNPost integration pending\"}");
    }

    @Override
    @Transactional
    public void updateShipmentStatus(Long shipmentId, ShipmentStatus status) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found: " + shipmentId));
        shipment.setShipmentStatus(status);
        shipmentRepository.save(shipment);
    }

    @Override
    public Shipment getShipmentByOrderId(Long orderId) {
        return shipmentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Shipment not found for order: " + orderId));
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    @Override
    public Shipment getShipmentById(Long id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shipment not found: " + id));
    }

    @Override
    @Transactional
    public void addTrackingHistory(Long shipmentId, String statusDescription, String location) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found: " + shipmentId));

        ShipmentTrackingHistory history = new ShipmentTrackingHistory();
        history.setShipment(shipment);
        history.setStatusDescription(statusDescription);
        history.setLocation(location);

        trackingHistoryRepository.save(history);
    }

    @Override
    public List<TrackingHistoryEntry> getTrackingHistories(Long shipmentId) {
        return trackingHistoryRepository.findByShipmentIdOrderByUpdatedAtDesc(shipmentId)
                .stream()
                .map(h -> TrackingHistoryEntry.builder()
                        .statusDescription(h.getStatusDescription())
                        .location(h.getLocation())
                        .updatedAt(h.getUpdatedAt())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public void updateOrderStatusFromShipment(Long orderId, ShipmentStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        // Map shipment status to order status
        OrderStatus newOrderStatus = switch (status) {
            case DELIVERED -> OrderStatus.DELIVERED;
            case RETURNED -> OrderStatus.RETURNED;
            default -> order.getOrderStatus(); // Keep current status for other cases
        };

        if (newOrderStatus != order.getOrderStatus()) {
            order.setOrderStatus(newOrderStatus);
            orderRepository.save(order);
        }
    }
}
