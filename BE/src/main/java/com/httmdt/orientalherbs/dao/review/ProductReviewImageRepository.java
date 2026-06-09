package com.httmdt.orientalherbs.dao.review;

import com.httmdt.orientalherbs.model.review.ProductReviewImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductReviewImageRepository extends JpaRepository<ProductReviewImage, Long> {
}
