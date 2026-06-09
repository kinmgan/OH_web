package com.httmdt.orientalherbs.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthRadarSummaryDto {
    private List<CategoryCount> categories;
    private int totalTags;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryCount {
        private String category;
        private String categoryDisplayName;
        private long count;
    }
}
