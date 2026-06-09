package com.httmdt.orientalherbs.controller.review;

import com.httmdt.orientalherbs.dto.review.ProductReviewCreateRequest;
import com.httmdt.orientalherbs.dto.review.ProductReviewResponse;
import com.httmdt.orientalherbs.dto.review.ReviewEligibilityResponse;
import com.httmdt.orientalherbs.security.user.CustomUserDetails;
import com.httmdt.orientalherbs.service.review.ProductReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService productReviewService;

    @GetMapping("/reviews/public/{productId}")
    public ResponseEntity<List<ProductReviewResponse>> getProductReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(productReviewService.getProductReviews(productId));
    }

    @GetMapping("/products/{productId}/review-eligibility")
    public ResponseEntity<ReviewEligibilityResponse> getReviewEligibility(
            @PathVariable Long productId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getUserId();
        return ResponseEntity.ok(productReviewService.getReviewEligibility(userId, productId));
    }

    @PostMapping("/reviews")
    public ResponseEntity<ProductReviewResponse> createReview(
            @Valid @RequestBody ProductReviewCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getUserId();
        try {
            ProductReviewResponse response = productReviewService.createReview(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }
}
