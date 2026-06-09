package com.httmdt.orientalherbs.service.review.impl;

import com.httmdt.orientalherbs.dao.catalog.ProductRepository;
import com.httmdt.orientalherbs.dao.order.OrderItemRepository;
import com.httmdt.orientalherbs.dao.review.ProductReviewRepository;
import com.httmdt.orientalherbs.dto.review.*;
import com.httmdt.orientalherbs.mapper.review.ReviewMapper;
import com.httmdt.orientalherbs.model.catalog.Product;
import com.httmdt.orientalherbs.model.order.OrderItem;
import com.httmdt.orientalherbs.model.order.Order;
import com.httmdt.orientalherbs.model.review.ProductReview;
import com.httmdt.orientalherbs.model.review.ProductReviewImage;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.service.ai.ReviewAiAnalyzerService;
import com.httmdt.orientalherbs.service.review.ProductReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductReviewServiceImpl implements ProductReviewService {

    private final ProductReviewRepository productReviewRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final ReviewMapper reviewMapper;
    private final ReviewAiAnalyzerService reviewAiAnalyzerService;

    private static final int MAX_IMAGES_PER_REVIEW = 5;

    @Override
    @Transactional
    public ProductReviewResponse createReview(Long userId, ProductReviewCreateRequest request) {
        // 1. Validate rating
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        // 2. Load OrderItem with order and product
        OrderItem orderItem = orderItemRepository.findWithOrderAndProductById(request.getOrderItemId())
                .orElseThrow(() -> new IllegalArgumentException("Order item not found"));

        Order order = orderItem.getOrder();
        Product product = orderItem.getProductVariant().getProduct();

        // 3. Check order belongs to user
        if (order.getUser() == null || !order.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("Order item does not belong to this user");
        }

        // 4. Check order is DELIVERED
        if (order.getOrderStatus() != com.httmdt.orientalherbs.model.enums.OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Can only review products from delivered orders");
        }

        // 5. Check product matches
        if (!product.getId().equals(request.getProductIdFromRequest())) {
            throw new IllegalArgumentException("Product in order item does not match the requested product");
        }

        // 6. Check not already reviewed
        if (productReviewRepository.existsByOrderItem_Id(request.getOrderItemId())) {
            throw new IllegalStateException("This order item has already been reviewed");
        }

        // 7. Check max images
        if (request.getImages() != null && request.getImages().size() > MAX_IMAGES_PER_REVIEW) {
            throw new IllegalArgumentException("Maximum " + MAX_IMAGES_PER_REVIEW + " images allowed per review");
        }

        // 8. Create review
        User user = order.getUser();
        ProductReview review = new ProductReview();
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setProduct(product);
        review.setUser(user);
        review.setOrderItem(orderItem);

        // 9. Add images
        if (request.getImages() != null) {
            for (int i = 0; i < request.getImages().size(); i++) {
                ReviewImageRequest imgReq = request.getImages().get(i);
                ProductReviewImage image = new ProductReviewImage(
                        imgReq.getImageUrl(),
                        imgReq.getImagePublicId(),
                        imgReq.getDisplayOrder() != null ? imgReq.getDisplayOrder() : i
                );
                review.addImage(image);
            }
        }

        // 10. Save review
        ProductReview savedReview = productReviewRepository.save(review);

        // Trigger async AI analysis (non-blocking)
        reviewAiAnalyzerService.analyzeReview(savedReview.getId());

        // 11. Update product average rating
        updateProductAverageRating(product);

        return reviewMapper.toResponse(savedReview);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductReviewResponse> getProductReviews(Long productId) {
        return productReviewRepository.findByProduct_IdOrderByCreatedAtDesc(productId)
                .stream()
                .map(reviewMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewEligibilityResponse getReviewEligibility(Long userId, Long productId) {
        List<OrderItem> reviewableItems = orderItemRepository.findReviewableItems(userId, productId);

        List<ReviewableOrderItemDto> items = reviewableItems.stream()
                .map(oi -> ReviewableOrderItemDto.builder()
                        .orderItemId(oi.getId())
                        .orderId(oi.getOrder().getOrder_id())
                        .productId(oi.getProductVariant().getProduct().getId())
                        .productName(oi.getProductVariant().getProduct().getName())
                        .variantInfo(oi.getProductVariant().getUnitName())
                        .quantity(oi.getQuantity())
                        .build())
                .toList();

        return ReviewEligibilityResponse.builder()
                .canReview(!items.isEmpty())
                .reviewableItems(items)
                .build();
    }

    private void updateProductAverageRating(Product product) {
        Double avg = productReviewRepository.averageRatingByProductId(product.getId());
        Double avgRating = avg != null ? Math.round(avg * 100.0) / 100.0 : 0.0;
        product.setAverageRating(avgRating);
        productRepository.save(product);
    }
}
