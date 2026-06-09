package com.httmdt.orientalherbs.mapper.catalog;

import com.httmdt.orientalherbs.dto.catalog.ProductSummaryDto;
import com.httmdt.orientalherbs.dto.pricing.PriceQuote;
import com.httmdt.orientalherbs.model.catalog.Product;
import com.httmdt.orientalherbs.model.catalog.ProductImage;
import com.httmdt.orientalherbs.model.catalog.ProductVariant;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.Map;

@Component
public class ProductMapper {

    public ProductSummaryDto toSummaryDto(Product product, Map<Long, PriceQuote> priceQuotes) {
        ProductSummaryDto dto = new ProductSummaryDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setRate(product.getAverageRating());
        dto.setSoldQuantity(product.getSoldQuantity());

        BigDecimal minPrice = BigDecimal.ZERO;
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            minPrice = product.getVariants().stream()
                    .map(v -> {
                        PriceQuote quote = priceQuotes.get(v.getProductVariantId());
                        return (quote != null && quote.isHasDiscount()) ? quote.getFinalPrice() : v.getPrice();
                    })
                    .min(Comparator.naturalOrder())
                    .orElse(BigDecimal.ZERO);
        }
        dto.setPrice(minPrice);

        if (product.getImages() != null && !product.getImages().isEmpty()) {
            String imageUrl = product.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsDefault()))
                    .findFirst()
                    .map(ProductImage::getProductImageUrl)
                    .orElse(product.getImages().get(0).getProductImageUrl());
            dto.setImageUrl(imageUrl);
        }

        return dto;
    }
}