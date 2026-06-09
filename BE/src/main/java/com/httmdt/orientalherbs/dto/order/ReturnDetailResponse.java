package com.httmdt.orientalherbs.dto.order;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReturnDetailResponse {
    private Long returnRequestId;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
    private java.util.List<String> evidenceImages;
}
