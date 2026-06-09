package com.httmdt.orientalherbs.service.payment;

import java.util.Map;

import com.httmdt.orientalherbs.dto.payment.PaymentInitResponse;
import com.httmdt.orientalherbs.dto.payment.PaymentStatusResponse;
import com.httmdt.orientalherbs.model.enums.PaymentMethod;

public interface PaymentService {
    PaymentInitResponse initPayment(Long orderId, PaymentMethod method);
    PaymentStatusResponse getPaymentStatus(Long orderId);
    void confirmPayment(Long orderId);
    Map<String, String> handleVnpayReturn(Map<String, String> params);
    void handleVnpayIpn(Map<String, String> params);
    void handleMomoIpn(Map<String, String> params);
    void handleZaloPayIpn(Map<String, String> params);
}
