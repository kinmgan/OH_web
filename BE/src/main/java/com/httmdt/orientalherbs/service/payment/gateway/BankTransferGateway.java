package com.httmdt.orientalherbs.service.payment.gateway;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.httmdt.orientalherbs.config.PaymentConfig;
import com.httmdt.orientalherbs.dto.payment.PaymentInitResponse;
import com.httmdt.orientalherbs.model.enums.PaymentMethod;
import com.httmdt.orientalherbs.model.enums.PaymentStatus;
import com.httmdt.orientalherbs.model.order.Order;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BankTransferGateway implements PaymentGateway {

    private final PaymentConfig paymentConfig;

    private static final String VIETQR_TEMPLATE = "compact";

    @Override
    public PaymentInitResponse createPaymentUrl(Order order, Long amount, String returnUrl) {
        PaymentConfig.BankTransfer bank = paymentConfig.getBank();

        String addInfo = "ORH" + order.getOrder_id();
        String vietqrUrl;
        try {
            vietqrUrl = String.format(
                    "https://img.vietqr.io/image/%s-%s-%s.png?amount=%d&addInfo=%s&template=%s",
                    bank.getBankBin(),
                    bank.getAccountNumber(),
                    "default",
                    amount,
                    URLEncoder.encode(addInfo, StandardCharsets.UTF_8),
                    VIETQR_TEMPLATE
            );
        } catch (Exception e) {
            vietqrUrl = "";
        }

        return PaymentInitResponse.builder()
                .paymentUrl(vietqrUrl)
                .orderId(order.getOrder_id())
                .expiredAt(LocalDateTime.now().plusHours(24))
                .method(PaymentMethod.BANK_TRANSFER)
                .message("Vui long chuyen khoan " + amount + " VND vao tai khoan: " + bank.getAccountNumber()
                        + " - " + bank.getAccountName() + " (" + bank.getBankName() + "). Ma don: " + addInfo)
                .build();
    }

    @Override
    public boolean verifyWebhook(Map<String, String> params) {
        // Bank transfer uses manual confirmation — no webhook
        return false;
    }

    @Override
    public String extractTransactionId(Map<String, String> params) {
        return null;
    }

    @Override
    public PaymentStatus extractStatus(Map<String, String> params) {
        return PaymentStatus.PENDING;
    }
}
