package com.httmdt.orientalherbs.service.payment.gateway;

import java.util.Map;

import com.httmdt.orientalherbs.dto.payment.PaymentInitResponse;
import com.httmdt.orientalherbs.model.enums.PaymentStatus;
import com.httmdt.orientalherbs.model.order.Order;

public interface PaymentGateway {
    PaymentInitResponse createPaymentUrl(Order order, Long amount, String returnUrl);
    boolean verifyWebhook(Map<String, String> params);
    String extractTransactionId(Map<String, String> params);
    PaymentStatus extractStatus(Map<String, String> params);
}
