package com.httmdt.orientalherbs.dto.catalog;

import com.httmdt.orientalherbs.model.enums.DiscountType;
import com.httmdt.orientalherbs.model.enums.HerbFlavor;
import com.httmdt.orientalherbs.model.enums.HerbProperty;
import com.httmdt.orientalherbs.model.enums.Meridian;
import com.httmdt.orientalherbs.model.enums.Sentiment;
import lombok.Builder;
import lombok.Data;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@Builder
public class ProductDetailResponseDto {
    private Long id;
    private String name;
    private String sku;
    private String description;
    private String origin;
    private Integer soldQuantity;
    private Double averageRating;
    private String categoryName;

    private Set<HerbProperty> properties;
    private Set<HerbFlavor> flavors;
    private Set<Meridian> meridians;
    private List<String> tags;

    private List<ProductImageDto> images;
    private List<String> certificateImages;
    private List<ProductVariantDto> variants;
    private List<ProductReviewDto> reviews;

    @Data
    @Builder
    public static class ProductImageDto {
        private Long id;
        private String productImageUrl;
        private Boolean isDefault;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductVariantDto {
        private Long id;
        private String unitName;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private BigDecimal finalPrice;
        private BigDecimal discountAmount;
        private DiscountType discountType;
        private BigDecimal discountValue;
        private Long campaignId;
        private String campaignName;
        private Integer stockQuantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductReviewDto {
        private Long id;
        private Integer rating;
        private String comment;
        private Sentiment sentiment;
        private List<String> keywords;
        private String reviewerName;
        private LocalDateTime createdAt;
        private List<ProductReviewImageDto> images;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductReviewImageDto {
        private Long id;
        private String imageUrl;
        private String imagePublicId;
        private Integer displayOrder;
    }

    public static class ProductVariantDtoBuilder {

        public ProductVariantDtoBuilder() {
        }
    }
}