package com.httmdt.orientalherbs.dao.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.order.OrderItem;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("""
      select oi from OrderItem oi
      join fetch oi.order o
      join fetch oi.productVariant pv
      join fetch pv.product p
      where oi.id = :orderItemId
    """)
    Optional<OrderItem> findWithOrderAndProductById(@Param("orderItemId") Long orderItemId);

    @Query("""
      select oi from OrderItem oi
      join oi.order o
      join oi.productVariant pv
      join pv.product p
      where o.user.userId = :userId
        and o.orderStatus = com.httmdt.orientalherbs.model.enums.OrderStatus.DELIVERED
        and p.id = :productId
        and not exists (
          select 1 from com.httmdt.orientalherbs.model.review.ProductReview r where r.orderItem.id = oi.id
        )
    """)
    List<OrderItem> findReviewableItems(@Param("userId") Long userId, @Param("productId") Long productId);
}
