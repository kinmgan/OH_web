package com.httmdt.orientalherbs.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewImageResponse {
    private Long id;
    private String imageUrl;
    private String imagePublicId;
    private Integer displayOrder;
}
