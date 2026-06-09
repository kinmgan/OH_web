package com.httmdt.orientalherbs.model.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import com.httmdt.orientalherbs.model.enums.ShippingCarrier;
import com.httmdt.orientalherbs.model.enums.ShipmentStatus;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shipments")
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "carrier_code", length = 50)
    private ShippingCarrier carrierCode;

    @Column(name = "carrier_order_id")
    private String carrierOrderId;

    @Column(name = "tracking_number")
    private String trackingNumber;

    @Column(name = "carrier_name")
    private String carrierName;

    @Enumerated(EnumType.STRING)
    @Column(name = "shipment_status")
    private ShipmentStatus shipmentStatus;

    @Column(name = "shipping_fee", precision = 19, scale = 2)
    private BigDecimal shippingFee;

    @Column(name = "cod_amount", precision = 19, scale = 2)
    private BigDecimal codAmount;

    @Column(name = "estimated_delivery_date")
    private LocalDateTime estimatedDeliveryDate;

    @Column(name = "actual_delivery_date")
    private LocalDateTime actualDeliveryDate;

    @Column(columnDefinition = "TEXT")
    private String rawCarrierResponse;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL)
    private List<ShipmentTrackingHistory> trackingHistories = new ArrayList<>();
}
