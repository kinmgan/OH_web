package com.httmdt.orientalherbs.mapper.catalog;

import com.httmdt.orientalherbs.dto.catalog.ProductDetailResponseDto;
import com.httmdt.orientalherbs.dto.catalog.ProductDetailResponseDto.ProductVariantDto.ProductVariantDtoBuilder;
import com.httmdt.orientalherbs.dto.pricing.PriceQuote;
import com.httmdt.orientalherbs.model.catalog.Product;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ProductDetailMapper {

    public ProductDetailResponseDto toDetailResponseDTO(Product product, Map<Long, PriceQuote> priceQuotes) {
        if (product == null) return null;

        return ProductDetailResponseDto.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .description(product.getDescription())
                .origin(product.getOrigin())
                .soldQuantity(product.getSoldQuantity())
                .averageRating(product.getAverageRating())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .properties(product.getProperties())
                .flavors(product.getFlavors())
                .meridians(product.getMeridians())
                .tags(product.getTags())
                .certificateImages(product.getCertificateImages())
                .images(product.getImages().stream().map(img ->
                        ProductDetailResponseDto.ProductImageDto.builder()
                                .id(img.getId())
                                .productImageUrl(img.getProductImageUrl())
                                .isDefault(img.getIsDefault())
                                .build()
                ).collect(Collectors.toList()))
                .variants(product.getVariants().stream().map(var -> {
                    PriceQuote quote = priceQuotes.get(var.getProductVariantId());
                    return mapVariantDto(var, quote);
                }).collect(Collectors.toList()))
                .reviews(product.getProductReviews().stream().map(rev ->
                        ProductDetailResponseDto.ProductReviewDto.builder()
                                .id(rev.getId())
                                .rating(rev.getRating())
                                .comment(rev.getComment())
                                .sentiment(rev.getSentiment())
                                .keywords(rev.getKeywords())
                                .reviewerName(rev.getUser() != null ? rev.getUser().getFullName() : "Khách hàng")
                                .createdAt(rev.getCreatedAt())
                                .images(rev.getImages() != null ? rev.getImages().stream().map(img ->
                                        ProductDetailResponseDto.ProductReviewImageDto.builder()
                                                .id(img.getId())
                                                .imageUrl(img.getImageUrl())
                                                .imagePublicId(img.getImagePublicId())
                                                .displayOrder(img.getDisplayOrder())
                                                .build()
                                ).collect(Collectors.toList()) : List.of())
                                .build()
                ).collect(Collectors.toList()))
                .build();
    }

    private ProductDetailResponseDto.ProductVariantDto mapVariantDto(
            com.httmdt.orientalherbs.model.catalog.ProductVariant var, PriceQuote quote) {
        ProductVariantDtoBuilder builder = ProductDetailResponseDto.ProductVariantDto.builder()
                .id(var.getProductVariantId())
                .unitName(var.getUnitName())
                .price(var.getPrice())
                .stockQuantity(var.getStockQuantity());

        if (quote != null && quote.isHasDiscount()) {
            builder.originalPrice(quote.getOriginalPrice())
                    .finalPrice(quote.getFinalPrice())
                    .discountAmount(quote.getDiscountAmount())
                    .discountType(quote.getDiscountType())
                    .discountValue(quote.getDiscountValue())
                    .campaignId(quote.getCampaignId())
                    .campaignName(quote.getCampaignName());
        } else {
            builder.originalPrice(var.getPrice())
                    .finalPrice(var.getPrice());
        }

        return builder.build();
    }
}
