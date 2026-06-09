package com.httmdt.orientalherbs.controller.admin_api;

import com.httmdt.orientalherbs.dto.shipping.ShipmentResponse;
import com.httmdt.orientalherbs.model.enums.ShipmentStatus;
import com.httmdt.orientalherbs.model.order.Shipment;
import com.httmdt.orientalherbs.service.shipping.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/shipments")
@RequiredArgsConstructor
public class ShipmentAdminController {

    private final ShipmentService shipmentService;

    @PostMapping("/order/{orderId}/create")
    public ResponseEntity<ShipmentResponse> createShipment(@PathVariable Long orderId) {
        Shipment shipment = shipmentService.createShipment(orderId);
        return ResponseEntity.ok(toResponse(shipment));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ShipmentResponse> getShipmentByOrder(@PathVariable Long orderId) {
        Shipment shipment = shipmentService.getShipmentByOrderId(orderId);
        return ResponseEntity.ok(toResponse(shipment));
    }

    @PutMapping("/{shipmentId}/status")
    public ResponseEntity<ShipmentResponse> updateStatus(
            @PathVariable Long shipmentId,
            @RequestParam ShipmentStatus status) {
        shipmentService.updateShipmentStatus(shipmentId, status);
        Shipment shipment = shipmentService.getShipmentById(shipmentId);
        return ResponseEntity.ok(toResponse(shipment));
    }

    private ShipmentResponse toResponse(Shipment shipment) {
        return new ShipmentResponse(
                shipment.getId(),
                shipment.getOrder().getOrder_id(),
                shipment.getCarrierCode() != null ? shipment.getCarrierCode().name() : null,
                shipment.getCarrierName(),
                shipment.getCarrierOrderId(),
                shipment.getTrackingNumber(),
                shipment.getShipmentStatus() != null ? shipment.getShipmentStatus().name() : null,
                shipment.getShippingFee(),
                shipment.getCodAmount(),
                shipment.getEstimatedDeliveryDate()
        );
    }
}
