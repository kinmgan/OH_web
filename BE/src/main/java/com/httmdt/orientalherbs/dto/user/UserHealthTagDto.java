package com.httmdt.orientalherbs.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserHealthTagDto {
    private Long id;
    private String tagName;
    private String category;
    private String categoryDisplayName;
    private String status;
    private String statusDisplayName;
    private String notes;
    private Double confidenceScore;
    private LocalDateTime detectedAt;
}
