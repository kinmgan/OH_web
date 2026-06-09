package com.httmdt.orientalherbs.model.catalog;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
public class ProductVariant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productVariantId;

    @Column(nullable = false)
    private String unitName; // Ví dụ: "200g", "500g", "1kg"

    @Column(name = "weight_gram", columnDefinition = "integer default 0")
    private Integer weightGram = 0;

    @Column(name = "length_cm", columnDefinition = "integer default 0")
    private Integer lengthCm = 0;

    @Column(name = "width_cm", columnDefinition = "integer default 0")
    private Integer widthCm = 0;

    @Column(name = "height_cm", columnDefinition = "integer default 0")
    private Integer heightCm = 0;

    @Column(nullable = false, precision = 38, scale = 2)
    private BigDecimal price;

    @Column(name = "stock_quantity")
    private Integer stockQuantity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
}