package com.httmdt.orientalherbs.service.shipping;

import com.httmdt.orientalherbs.dto.order.TrackingHistoryEntry;
import com.httmdt.orientalherbs.model.enums.ShipmentStatus;
import com.httmdt.orientalherbs.model.order.Shipment;

import java.util.List;

public interface ShipmentService {
    Shipment createShipment(Long orderId);
    void updateShipmentStatus(Long shipmentId, ShipmentStatus status);
    Shipment getShipmentByOrderId(Long orderId);
    Shipment getShipmentById(Long id);
    void addTrackingHistory(Long shipmentId, String statusDescription, String location);
    List<TrackingHistoryEntry> getTrackingHistories(Long shipmentId);
    void updateOrderStatusFromShipment(Long orderId, ShipmentStatus status);
}
