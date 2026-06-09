package com.httmdt.orientalherbs.model.catalog;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import org.hibernate.annotations.BatchSize;

import com.httmdt.orientalherbs.model.enums.HerbFlavor;
import com.httmdt.orientalherbs.model.enums.HerbProperty;
import com.httmdt.orientalherbs.model.enums.Meridian;
import com.httmdt.orientalherbs.model.review.ProductReview;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor

public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    private String origin;

    @Column(name = "sold_quantity", columnDefinition = "integer default 0")
    private Integer soldQuantity = 0;

    @Column(name = "average_rating", columnDefinition = "numeric(3,2) default 0.0")
    private Double averageRating = 0.0;

    @Column(name = "min_price", precision = 10, scale = 2) // Tùy chỉnh precision theo nhu cầu của bạn
    private BigDecimal minPrice = BigDecimal.ZERO;

    @ElementCollection(targetClass = HerbProperty.class)
    @CollectionTable(name = "product_properties", joinColumns = @JoinColumn(name = "product_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "property")
    private Set<HerbProperty> properties = new HashSet<>();

    @ElementCollection(targetClass = HerbFlavor.class)
    @CollectionTable(name = "product_flavors", joinColumns = @JoinColumn(name = "product_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "flavor")
    private Set<HerbFlavor> flavors = new HashSet<>();

    @ElementCollection(targetClass = Meridian.class)
    @CollectionTable(name = "product_meridians", joinColumns = @JoinColumn(name = "product_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "meridian")
    private Set<Meridian> meridians = new HashSet<>();

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tags", columnDefinition = "text[]")
    private List<String> tags = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "certificate_images", columnDefinition = "text[]")
    private List<String> certificateImages = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<ProductImage> images;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    @BatchSize(size = 50)
    private List<ProductReview> productReviews;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<ProductVariant> variants = new ArrayList<>();
}
