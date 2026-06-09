package com.httmdt.orientalherbs.model.marketing_and_campaign;

import java.math.BigDecimal;

import com.httmdt.orientalherbs.model.catalog.Product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "campaign_pinned_products")
public class CampaignPinnedProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "custom_title") // Đã sửa typo custom_titlle
    private String customTitle;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "discount_price")
    private BigDecimal discountPrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
}