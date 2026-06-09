package com.httmdt.orientalherbs.service.payment.gateway;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

import org.springframework.stereotype.Component;

import com.httmdt.orientalherbs.config.PaymentConfig;
import com.httmdt.orientalherbs.dto.payment.PaymentInitResponse;
import com.httmdt.orientalherbs.model.enums.PaymentMethod;
import com.httmdt.orientalherbs.model.enums.PaymentStatus;
import com.httmdt.orientalherbs.model.order.Order;

import lombok.RequiredArgsConstructor;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@Component
@RequiredArgsConstructor
public class MomoGateway implements PaymentGateway {

    private final PaymentConfig paymentConfig;

    private static final String HASH_ALGORITHM = "HmacSHA256";

    @Override
    public PaymentInitResponse createPaymentUrl(Order order, Long amount, String returnUrl) {
        PaymentConfig.Momo momo = paymentConfig.getMomo();

        String requestId = UUID.randomUUID().toString();
        String orderId = "MOMO" + order.getOrder_id() + "_" + System.currentTimeMillis();
        String orderInfo = "Thanh toan don hang ORH" + order.getOrder_id();

        Map<String, String> params = new TreeMap<>();
        params.put("partnerCode", momo.getPartnerCode());
        params.put("accessKey", momo.getAccessKey());
        params.put("requestId", requestId);
        params.put("amount", String.valueOf(amount));
        params.put("orderId", orderId);
        params.put("orderInfo", orderInfo);
        params.put("redirectUrl", returnUrl);
        params.put("ipnUrl", momo.getIpnUrl());
        params.put("requestType", "payWithMethod");
        params.put("extraData", "");
        params.put("lang", "vi");

        String rawSignature = buildSignatureString(params);
        String signature = generateHmacSha256(rawSignature, momo.getSecretKey());

        StringBuilder requestBody = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (requestBody.length() > 0) requestBody.append("&");
            requestBody.append(entry.getKey()).append("=").append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
        }
        requestBody.append("&signature=").append(URLEncoder.encode(signature, StandardCharsets.UTF_8));

        // Call MoMo API using Spring RestTemplate
        String payUrl = callMomoApi(momo.getApiUrl(), requestBody.toString());

        return PaymentInitResponse.builder()
                .paymentUrl(payUrl)
                .orderId(order.getOrder_id())
                .method(PaymentMethod.MOMO)
                .build();
    }

    @Override
    public boolean verifyWebhook(Map<String, String> params) {
        String receivedSignature = params.get("signature");
        if (receivedSignature == null) return false;

        Map<String, String> data = new TreeMap<>();
        data.put("partnerCode", params.get("partnerCode"));
        data.put("accessKey", params.get("accessKey"));
        data.put("requestId", params.get("requestId"));
        data.put("amount", params.get("amount"));
        data.put("orderId", params.get("orderId"));
        data.put("orderInfo", params.get("orderInfo"));
        data.put("orderType", params.get("orderType"));
        data.put("transId", params.get("transId"));
        data.put("resultCode", params.get("resultCode"));
        data.put("message", params.get("message"));
        data.put("responseTime", params.get("responseTime"));
        data.put("extraData", params.get("extraData"));

        String rawSignature = buildSignatureString(data);
        String expectedSignature = generateHmacSha256(rawSignature, paymentConfig.getMomo().getSecretKey());
        return expectedSignature.equalsIgnoreCase(receivedSignature);
    }

    @Override
    public String extractTransactionId(Map<String, String> params) {
        return params.get("transId");
    }

    @Override
    public PaymentStatus extractStatus(Map<String, String> params) {
        try {
            int resultCode = Integer.parseInt(params.getOrDefault("resultCode", "-1"));
            return resultCode == 0 ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
        } catch (NumberFormatException e) {
            return PaymentStatus.FAILED;
        }
    }

    private String buildSignatureString(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                if (sb.length() > 0) sb.append("&");
                sb.append(entry.getKey()).append("=").append(entry.getValue());
            }
        }
        return sb.toString();
    }

    private String generateHmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance(HASH_ALGORITHM);
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), HASH_ALGORITHM);
            mac.init(secretKey);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Failed to generate MoMo HMAC-SHA256 signature", e);
        }
    }

    private String callMomoApi(String url, String requestBody) {
        try {
            java.net.URL obj = new java.net.URL(url);
            java.net.HttpURLConnection con = (java.net.HttpURLConnection) obj.openConnection();
            con.setRequestMethod("POST");
            con.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            con.setDoOutput(true);
            try (java.io.DataOutputStream wr = new java.io.DataOutputStream(con.getOutputStream())) {
                wr.writeBytes(requestBody);
                wr.flush();
            }
            int responseCode = con.getResponseCode();
            if (responseCode == 200) {
                try (java.io.BufferedReader in = new java.io.BufferedReader(
                        new java.io.InputStreamReader(con.getInputStream(), StandardCharsets.UTF_8))) {
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = in.readLine()) != null) {
                        response.append(line);
                    }
                    // Parse payUrl from JSON response
                    String json = response.toString();
                    int payUrlIndex = json.indexOf("\"payUrl\":\"");
                    if (payUrlIndex == -1) payUrlIndex = json.indexOf("\"payurl\":\"");
                    if (payUrlIndex != -1) {
                        int start = payUrlIndex + 9;
                        int end = json.indexOf("\"", start);
                        return json.substring(start, end);
                    }
                    return json;
                }
            }
            throw new RuntimeException("MoMo API returned status: " + responseCode);
        } catch (Exception e) {
            throw new RuntimeException("Failed to call MoMo API", e);
        }
    }
}
