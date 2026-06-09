package com.httmdt.orientalherbs.dao.review;

import com.httmdt.orientalherbs.model.enums.Sentiment;
import com.httmdt.orientalherbs.model.review.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    boolean existsByOrderItem_Id(Long orderItemId);

    List<ProductReview> findByProduct_IdOrderByCreatedAtDesc(Long productId);

    long countByProduct_Id(Long productId);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.id = :productId")
    Double averageRatingByProductId(@Param("productId") Long productId);

    boolean existsByProduct_IdAndUser_UserId(Long productId, Long userId);

    @Query("SELECT r.sentiment, COUNT(r) FROM ProductReview r " +
           "WHERE r.createdAt >= :startDate AND r.createdAt <= :endDate " +
           "GROUP BY r.sentiment")
    List<Object[]> countBySentimentInDateRange(@Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate);

    @Query("SELECT r.keywords FROM ProductReview r " +
           "WHERE r.createdAt >= :startDate AND r.createdAt <= :endDate " +
           "AND r.keywords IS NOT NULL")
    List<List<String>> findAllKeywordsInDateRange(@Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate);
}
