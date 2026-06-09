package com.httmdt.orientalherbs.service.pricing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.httmdt.orientalherbs.dao.catalog.ProductVariantRepository;
import com.httmdt.orientalherbs.dao.marketing_and_campaign.CampaignProductVariantRepository;
import com.httmdt.orientalherbs.dto.pricing.PriceQuote;
import com.httmdt.orientalherbs.model.catalog.ProductVariant;
import com.httmdt.orientalherbs.model.enums.CampaignStatus;
import com.httmdt.orientalherbs.model.enums.DiscountType;
import com.httmdt.orientalherbs.model.marketing_and_campaign.CampaignProductVariant;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PricingServiceImpl implements PricingService {

    private final CampaignProductVariantRepository campaignProductVariantRepository;
    private final ProductVariantRepository productVariantRepository;

    @Override
    public PriceQuote quote(Long productVariantId) {
        ProductVariant variant = productVariantRepository.findById(productVariantId)
                .orElseThrow(() -> new IllegalArgumentException("Product variant not found: " + productVariantId));

        BigDecimal originalPrice = variant.getPrice();
        LocalDateTime now = LocalDateTime.now();

        return campaignProductVariantRepository
                .findActiveDiscountByProductVariantId(productVariantId, CampaignStatus.ACTIVE, now)
                .map(cpv -> calculatePrice(cpv, originalPrice))
                .orElse(PriceQuote.builder()
                        .productVariantId(productVariantId)
                        .originalPrice(originalPrice)
                        .finalPrice(originalPrice)
                        .discountAmount(BigDecimal.ZERO)
                        .hasDiscount(false)
                        .build());
    }

    @Override
    public Map<Long, PriceQuote> quoteBatch(List<Long> productVariantIds) {
        if (productVariantIds == null || productVariantIds.isEmpty()) {
            return new HashMap<>();
        }

        LocalDateTime now = LocalDateTime.now();
        List<CampaignProductVariant> activeDiscounts = campaignProductVariantRepository
                .findActiveDiscountsByProductVariantIds(productVariantIds, now);

        Map<Long, CampaignProductVariant> discountMap = activeDiscounts.stream()
                .collect(Collectors.toMap(
                        cpv -> cpv.getProductVariant().getProductVariantId(),
                        Function.identity(),
                        (existing, replacement) -> existing
                ));

        Map<Long, ProductVariant> variantMap = productVariantRepository.findAllById(productVariantIds).stream()
                .collect(Collectors.toMap(ProductVariant::getProductVariantId, Function.identity()));

        Map<Long, PriceQuote> result = new HashMap<>();

        for (Long variantId : productVariantIds) {
            ProductVariant variant = variantMap.get(variantId);
            if (variant == null) {
                continue;
            }

            BigDecimal originalPrice = variant.getPrice();
            CampaignProductVariant discount = discountMap.get(variantId);

            if (discount != null) {
                result.put(variantId, calculatePrice(discount, originalPrice));
            } else {
                result.put(variantId, PriceQuote.builder()
                        .productVariantId(variantId)
                        .originalPrice(originalPrice)
                        .finalPrice(originalPrice)
                        .discountAmount(BigDecimal.ZERO)
                        .hasDiscount(false)
                        .build());
            }
        }

        return result;
    }

    private PriceQuote calculatePrice(CampaignProductVariant cpv, BigDecimal originalPrice) {
        BigDecimal discountAmount;
        BigDecimal finalPrice;

        if (cpv.getDiscountType() == DiscountType.PERCENTAGE) {
            discountAmount = originalPrice.multiply(cpv.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discountAmount = cpv.getDiscountValue().min(originalPrice);
        }

        finalPrice = originalPrice.subtract(discountAmount);

        if (finalPrice.compareTo(BigDecimal.ZERO) < 0) {
            finalPrice = BigDecimal.ZERO;
            discountAmount = originalPrice;
        }

        return PriceQuote.builder()
                .productVariantId(cpv.getProductVariant().getProductVariantId())
                .originalPrice(originalPrice)
                .finalPrice(finalPrice)
                .discountAmount(discountAmount)
                .discountType(cpv.getDiscountType())
                .discountValue(cpv.getDiscountValue())
                .campaignId(cpv.getCampaign().getId())
                .campaignName(cpv.getCampaign().getName())
                .hasDiscount(true)
                .build();
    }
}
