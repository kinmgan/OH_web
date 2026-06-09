package com.httmdt.orientalherbs.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShipmentDetailResponse {
    private Long shipmentId;
    private String carrierCode;
    private String carrierName;
    private String carrierOrderId;
    private String trackingNumber;
    private String shipmentStatus;
    private BigDecimal shippingFee;
    private BigDecimal codAmount;
    private LocalDateTime estimatedDeliveryDate;
    private LocalDateTime actualDeliveryDate;
    private List<TrackingHistoryEntry> trackingHistories;
}
