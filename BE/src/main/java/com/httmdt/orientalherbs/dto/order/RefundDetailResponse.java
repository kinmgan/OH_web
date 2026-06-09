package com.httmdt.orientalherbs.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RefundDetailResponse {
    private Long refundId;
    private BigDecimal refundAmount;
    private String status;
    private LocalDateTime refundedAt;
    private String reason;
}
