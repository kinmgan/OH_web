package com.httmdt.orientalherbs.dto.review;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewImageRequest {
    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    private String imagePublicId;

    private Integer displayOrder;
}
