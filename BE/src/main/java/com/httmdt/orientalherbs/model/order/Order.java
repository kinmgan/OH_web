package com.httmdt.orientalherbs.model.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import com.httmdt.orientalherbs.model.enums.OrderStatus;
import com.httmdt.orientalherbs.model.enums.PaymentMethod;
import com.httmdt.orientalherbs.model.enums.ShippingCarrier;
import com.httmdt.orientalherbs.model.user.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table (name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long order_id;

    @Column(nullable=false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column
    private OrderStatus orderStatus;

    @CreationTimestamp
    @Column (nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "subtotal")
    private BigDecimal subtotal;

    @Column(name = "discount_amount")
    private BigDecimal discountAmount;

    @Column(name = "items_original_subtotal", precision = 38, scale = 2)
    private BigDecimal itemsOriginalSubtotal;

    @Column(name = "campaign_discount_amount", precision = 38, scale = 2)
    private BigDecimal campaignDiscountAmount;


    @Column(name = "shipping_fee")
    private BigDecimal shippingFee;

    @Column(name = "address_id")
    private Long addressId;

    @Column(name = "recipient_name")
    private String recipientName;

    @Column(name = "recipient_phone")
    private String recipientPhone;

    @Column(name = "address_detail", columnDefinition = "TEXT")
    private String addressDetail;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems = new ArrayList<>();

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Payment payment;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Shipment shipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;


    @Enumerated(EnumType.STRING)
    @Column(name = "shipping_carrier", length = 50)
    private ShippingCarrier shippingCarrier;

    @Column(name = "cod_amount", precision = 19, scale = 2)
    private java.math.BigDecimal codAmount;
}
