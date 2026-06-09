package com.httmdt.orientalherbs.dto.order;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentDetailResponse {
    private Long paymentId;
    private String status;
    private LocalDateTime paidAt;
}
