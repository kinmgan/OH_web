package com.httmdt.orientalherbs.dao.cart;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.cart.CartItem;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    void deleteByCart_CartId(Long cartId);

    Optional<CartItem> findByCart_CartIdAndProductVariant_ProductVariantId(Long cartId, Long productVariantId);
}
