package com.httmdt.orientalherbs.dto.review;

import com.httmdt.orientalherbs.model.enums.Sentiment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewResponse {
    private Long id;
    private Long productId;
    private Long orderItemId;
    private Integer rating;
    private String comment;
    private Sentiment sentiment;
    private List<String> keywords;
    private String reviewerName;
    private LocalDateTime createdAt;
    private List<ReviewImageResponse> images;
}
