package com.httmdt.orientalherbs.model.marketing_and_campaign;

import java.math.BigDecimal;

import com.httmdt.orientalherbs.model.catalog.ProductVariant;
import com.httmdt.orientalherbs.model.enums.DiscountType;

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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "campaign_product_variants")
public class CampaignProductVariant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 38, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "original_price_snapshot", nullable = false, precision = 38, scale = 2)
    private BigDecimal originalPriceSnapshot;

    @Column(name = "discount_amount_snapshot", nullable = false, precision = 38, scale = 2)
    private BigDecimal discountAmountSnapshot;

    @Column(name = "final_price_snapshot", nullable = false, precision = 38, scale = 2)
    private BigDecimal finalPriceSnapshot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id", nullable = false)
    private ProductVariant productVariant;
}
