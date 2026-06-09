package com.httmdt.orientalherbs.service.cart;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.httmdt.orientalherbs.dao.cart.CartItemRepository;
import com.httmdt.orientalherbs.dao.cart.CartRepository;
import com.httmdt.orientalherbs.dao.catalog.ProductVariantRepository;
import com.httmdt.orientalherbs.dto.cart.CartItemRequest;
import com.httmdt.orientalherbs.dto.cart.CartItemResponse;
import com.httmdt.orientalherbs.dto.cart.CartItemUpdateRequest;
import com.httmdt.orientalherbs.dto.pricing.PriceQuote;
import com.httmdt.orientalherbs.mapper.cart.CartMapper;
import com.httmdt.orientalherbs.model.cart.Cart;
import com.httmdt.orientalherbs.model.cart.CartItem;
import com.httmdt.orientalherbs.model.catalog.ProductVariant;
import com.httmdt.orientalherbs.service.pricing.PricingService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CartMapper cartMapper;
    private final PricingService pricingService;

    @Override
    public List<CartItemResponse> getCartItems(Long userId) {
        Cart cart = cartRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng với ID: " + userId));

        List<Long> variantIds = cart.getCartItems().stream()
                .map(item -> item.getProductVariant().getProductVariantId())
                .collect(Collectors.toList());

        Map<Long, PriceQuote> priceQuotes = pricingService.quoteBatch(variantIds);

        return cart.getCartItems().stream()
                .map(item -> {
                    PriceQuote quote = priceQuotes.get(item.getProductVariant().getProductVariantId());
                    return cartMapper.toResponse(item, quote);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CartItemResponse addToCart(Long userId, CartItemRequest request) {
        Cart cart = cartRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng với ID: " + userId));
        ProductVariant productVariant = productVariantRepository.findById(request.getProductVariantId())
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy biến thể sản phẩm với ID: " + request.getProductVariantId()));

        CartItem cartItem = cartItemRepository
                .findByCart_CartIdAndProductVariant_ProductVariantId(cart.getCartId(),
                        productVariant.getProductVariantId())
                .orElse(null);

        if (cartItem != null) {
            int newQuantity = cartItem.getQuantity() + request.getQuantity();
            if (newQuantity > productVariant.getStockQuantity()) {
                throw new RuntimeException("Số lượng vượt quá tồn kho");
            }
            cartItem.setQuantity(newQuantity);
        } else {
            if (request.getQuantity() > productVariant.getStockQuantity()) {
                throw new RuntimeException("Số lượng vượt quá tồn kho");
            }
            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProductVariant(productVariant);
            cartItem.setQuantity(request.getQuantity());
        }
        cartItemRepository.save(cartItem);

        PriceQuote quote = pricingService.quote(request.getProductVariantId());
        return cartMapper.toResponse(cartItem, quote);
    }

    @Override
    @Transactional
    public CartItemResponse updateCartItemQuantity(Long userId, Long cartItemId, CartItemUpdateRequest request) {
        if (request.getQuantity() <= 0) {
            throw new RuntimeException("Số lượng sản phẩm phải lớn hơn 0. Nếu muốn xóa, vui lòng dùng chức năng xóa.");
        }

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món hàng trong giỏ"));

        if (!cartItem.getCart().getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền sửa giỏ hàng của người khác");
        }

        ProductVariant variant = cartItem.getProductVariant();
        if (request.getQuantity() > variant.getStockQuantity()) {
            throw new RuntimeException("Số lượng cập nhật vượt quá tồn kho. Kho còn: " + variant.getStockQuantity());
        }

        cartItem.setQuantity(request.getQuantity());
        CartItem savedItem = cartItemRepository.save(cartItem);

        PriceQuote quote = pricingService.quote(savedItem.getProductVariant().getProductVariantId());
        return cartMapper.toResponse(savedItem, quote);
    }

    @Override
    @Transactional
    public void removeCartItem(Long userId, Long cartItemId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món hàng trong giỏ"));

        if (!cartItem.getCart().getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa món hàng này");
        }

        cartItemRepository.delete(cartItem);
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Giỏ hàng không tồn tại"));

        cartItemRepository.deleteByCart_CartId(cart.getCartId());
    }
}
