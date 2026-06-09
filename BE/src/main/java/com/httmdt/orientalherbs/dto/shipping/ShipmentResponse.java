package com.httmdt.orientalherbs.dto.shipping;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentResponse {
    private Long id;
    private Long orderId;
    private String carrierCode;
    private String carrierName;
    private String carrierOrderId;
    private String trackingNumber;
    private String shipmentStatus;
    private BigDecimal shippingFee;
    private BigDecimal codAmount;
    private LocalDateTime estimatedDeliveryDate;
}
