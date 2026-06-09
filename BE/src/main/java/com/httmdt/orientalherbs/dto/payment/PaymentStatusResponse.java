package com.httmdt.orientalherbs.dto.payment;

import com.httmdt.orientalherbs.model.enums.PaymentStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusResponse {
    private Long orderId;
    private PaymentStatus paymentStatus;
    private String message;
}
