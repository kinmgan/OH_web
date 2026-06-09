package com.httmdt.orientalherbs.dto.order;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TrackingHistoryEntry {
    private String statusDescription;
    private String location;
    private LocalDateTime updatedAt;
}
