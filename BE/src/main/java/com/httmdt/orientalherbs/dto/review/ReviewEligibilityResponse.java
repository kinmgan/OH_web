package com.httmdt.orientalherbs.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewEligibilityResponse {
    private boolean canReview;
    private List<ReviewableOrderItemDto> reviewableItems;
}
