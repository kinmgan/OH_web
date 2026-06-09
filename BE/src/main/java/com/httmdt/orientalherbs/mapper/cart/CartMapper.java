package com.httmdt.orientalherbs.mapper.cart;

import com.httmdt.orientalherbs.dto.cart.CartItemResponse;
import com.httmdt.orientalherbs.dto.pricing.PriceQuote;
import com.httmdt.orientalherbs.model.cart.CartItem;
import com.httmdt.orientalherbs.model.catalog.Product;
import com.httmdt.orientalherbs.model.catalog.ProductImage;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class CartMapper {

    public CartItemResponse toResponse(CartItem cartItem, PriceQuote quote) {
        if (cartItem == null) {
            return null;
        }

        CartItemResponse response = new CartItemResponse();
        response.setCartItemId(cartItem.getId());
        response.setQuantity(cartItem.getQuantity());

        if (cartItem.getProductVariant() != null) {
            response.setProductVariantId(cartItem.getProductVariant().getProductVariantId());
            response.setProductName(cartItem.getProductVariant().getProduct().getName());
            response.setUnitName(cartItem.getProductVariant().getUnitName());
            response.setStockQuantity(cartItem.getProductVariant().getStockQuantity());

            Product product = cartItem.getProductVariant().getProduct();
            if (product.getImages() != null && !product.getImages().isEmpty()) {
                String imageUrl = product.getImages().stream()
                        .filter(img -> Boolean.TRUE.equals(img.getIsDefault()))
                        .findFirst()
                        .map(ProductImage::getProductImageUrl)
                        .orElse(product.getImages().get(0).getProductImageUrl());
                response.setImageUrl(imageUrl);
            }

            BigDecimal finalPrice;
            BigDecimal originalPrice = cartItem.getProductVariant().getPrice();

            if (quote != null && quote.isHasDiscount()) {
                originalPrice = quote.getOriginalPrice();
                finalPrice = quote.getFinalPrice();
                response.setOriginalPrice(originalPrice);
                response.setFinalPrice(finalPrice);
                response.setDiscountAmount(quote.getDiscountAmount());
                response.setDiscountType(quote.getDiscountType());
                response.setDiscountValue(quote.getDiscountValue());
                response.setCampaignId(quote.getCampaignId());
                response.setCampaignName(quote.getCampaignName());
            } else {
                finalPrice = originalPrice;
                response.setOriginalPrice(originalPrice);
                response.setFinalPrice(finalPrice);
            }

            response.setPrice(finalPrice);
            if (finalPrice != null && cartItem.getQuantity() != null) {
                response.setTotalPrice(finalPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            }
        }

        return response;
    }
}