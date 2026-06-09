package com.httmdt.orientalherbs.dto.payment;

import java.time.LocalDateTime;

import com.httmdt.orientalherbs.model.enums.PaymentMethod;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInitResponse {
    private String paymentUrl;
    private Long orderId;
    private LocalDateTime expiredAt;
    private PaymentMethod method;
    private String message;
}
