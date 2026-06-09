package com.httmdt.orientalherbs.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewableOrderItemDto {
    private Long orderItemId;
    private Long orderId;
    private Long productId;
    private String productName;
    private String variantInfo;
    private Integer quantity;
}
