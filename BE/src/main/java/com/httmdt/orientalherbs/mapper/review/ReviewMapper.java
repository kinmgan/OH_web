package com.httmdt.orientalherbs.mapper.review;

import com.httmdt.orientalherbs.dto.review.ProductReviewResponse;
import com.httmdt.orientalherbs.dto.review.ReviewImageResponse;
import com.httmdt.orientalherbs.model.review.ProductReview;
import com.httmdt.orientalherbs.model.review.ProductReviewImage;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ReviewMapper {

    public ProductReviewResponse toResponse(ProductReview review) {
        if (review == null) {
            return null;
        }

        return ProductReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .orderItemId(review.getOrderItem() != null ? review.getOrderItem().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .sentiment(review.getSentiment())
                .keywords(review.getKeywords())
                .reviewerName(review.getUser().getFullName())
                .createdAt(review.getCreatedAt())
                .images(toImageResponseList(review.getImages()))
                .build();
    }

    public List<ReviewImageResponse> toImageResponseList(List<ProductReviewImage> images) {
        if (images == null) {
            return List.of();
        }

        return images.stream()
                .map(this::toImageResponse)
                .toList();
    }

    public ReviewImageResponse toImageResponse(ProductReviewImage image) {
        if (image == null) {
            return null;
        }

        return ReviewImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .imagePublicId(image.getImagePublicId())
                .displayOrder(image.getDisplayOrder())
                .build();
    }
}
