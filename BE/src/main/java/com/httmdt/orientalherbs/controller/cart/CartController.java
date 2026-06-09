package com.httmdt.orientalherbs.controller.cart;

import com.httmdt.orientalherbs.dto.cart.CartItemRequest;
import com.httmdt.orientalherbs.dto.cart.CartItemResponse;
import com.httmdt.orientalherbs.dto.cart.CartItemUpdateRequest;
import com.httmdt.orientalherbs.security.user.CustomUserDetails;
import com.httmdt.orientalherbs.service.cart.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    // Lấy giỏ hàng của user hiện tại
    @GetMapping("/items")
    public ResponseEntity<List<CartItemResponse>> getCartItems(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getId();
        List<CartItemResponse> items = cartService.getCartItems(userId);
        return ResponseEntity.ok(items);
    }

    // Thêm sản phẩm vào giỏ hàng
    @PostMapping("/items")
    public ResponseEntity<CartItemResponse> addToCart(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody CartItemRequest request) {
        Long userId = userDetails.getId();
        CartItemResponse response = cartService.addToCart(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Cập nhật số lượng sản phẩm
    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartItemResponse> updateQuantity(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long cartItemId,
            @RequestBody CartItemUpdateRequest request) {
        Long userId = userDetails.getId();
        CartItemResponse response = cartService.updateCartItemQuantity(userId, cartItemId, request);
        return ResponseEntity.ok(response);
    }

    // Xóa một sản phẩm khỏi giỏ
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<Void> removeCartItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long cartItemId) {
        Long userId = userDetails.getId();
        cartService.removeCartItem(userId, cartItemId);
        return ResponseEntity.noContent().build();
    }

    // Làm sạch giỏ hàng
    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getId();
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}