package com.httmdt.orientalherbs.service.cart;

import com.httmdt.orientalherbs.dto.cart.CartItemRequest;
import com.httmdt.orientalherbs.dto.cart.CartItemResponse;
import com.httmdt.orientalherbs.dto.cart.CartItemUpdateRequest;

import java.util.List;

public interface CartService {
    // Lấy danh sách sản phẩm trong giỏ (tính luôn tổng tiền giỏ hàng ở FE hoặc BE
    // đều được)
    List<CartItemResponse> getCartItems(Long userId);

    // Logic: Tìm variant -> Check kho -> Tìm item trong giỏ -> Cộng dồn -> Lưu
    CartItemResponse addToCart(Long userId, CartItemRequest request);

    // Logic: Check kho -> Cập nhật số lượng -> Lưu
    CartItemResponse updateCartItemQuantity(Long userId, Long cartItemId, CartItemUpdateRequest request);

    void removeCartItem(Long userId, Long cartItemId);

    void clearCart(Long userId);
}