package com.httmdt.orientalherbs.service.review;

import com.httmdt.orientalherbs.dto.review.ProductReviewCreateRequest;
import com.httmdt.orientalherbs.dto.review.ProductReviewResponse;
import com.httmdt.orientalherbs.dto.review.ReviewEligibilityResponse;

import java.util.List;

public interface ProductReviewService {

    ProductReviewResponse createReview(Long userId, ProductReviewCreateRequest request);

    List<ProductReviewResponse> getProductReviews(Long productId);

    ReviewEligibilityResponse getReviewEligibility(Long userId, Long productId);
}
