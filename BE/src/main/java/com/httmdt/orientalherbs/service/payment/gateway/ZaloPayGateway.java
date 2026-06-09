package com.httmdt.orientalherbs.service.payment.gateway;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
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
public class ZaloPayGateway implements PaymentGateway {

    private final PaymentConfig paymentConfig;

    private static final String HASH_ALGORITHM = "HmacSHA256";

    @Override
    public PaymentInitResponse createPaymentUrl(Order order, Long amount, String returnUrl) {
        PaymentConfig.ZaloPay zalopay = paymentConfig.getZalopay();

        String appId = zalopay.getAppId();
        String appUser = "user_" + order.getUser().getUserId();
        long appTime = System.currentTimeMillis();
        String appTransId = new java.text.SimpleDateFormat("yyMMdd", java.util.Locale.US)
                .format(new java.util.Date()) + "_" + order.getOrder_id();

        Map<String, Object> embedData = new HashMap<>();
        embedData.put("redirecturl", returnUrl);

        Map<String, Object> item = new HashMap<>();
        item.put("item_id", order.getOrder_id().toString());
        item.put("item_name", "Don hang ORH" + order.getOrder_id());
        item.put("item_price", amount);

        String embedDataStr;
        String itemStr;
        try {
            ObjectMapper mapper = new ObjectMapper();
            embedDataStr = mapper.writeValueAsString(embedData);
            itemStr = mapper.writeValueAsString(Collections.singletonList(item));
        } catch (Exception e) {
            embedDataStr = "{}";
            itemStr = "[]";
        }

        String description = "Thanh toan don hang ORH" + order.getOrder_id();

        String data = appId + "|" + appTransId + "|" + appUser + "|" + amount + "|" + appTime + "|" + embedDataStr + "|" + itemStr;
        String mac = generateHmacSha256(data, zalopay.getKey1());

        Map<String, String> params = new TreeMap<>();
        params.put("app_id", appId);
        params.put("app_user", appUser);
        params.put("app_time", String.valueOf(appTime));
        params.put("amount", String.valueOf(amount));
        params.put("app_trans_id", appTransId);
        params.put("embed_data", embedDataStr);
        params.put("item", itemStr);
        params.put("description", description);
        params.put("mac", mac);

        String orderUrl = callZaloPayApi(zalopay.getApiUrl(), params);

        return PaymentInitResponse.builder()
                .paymentUrl(orderUrl)
                .orderId(order.getOrder_id())
                .method(PaymentMethod.ZALOPAY)
                .build();
    }

    @Override
    public boolean verifyWebhook(Map<String, String> params) {
        String receivedMac = params.get("mac");
        if (receivedMac == null) return false;

        String data = params.get("appid") + "|" + params.get("apptransid") + "|"
                + params.get("pmcid") + "|" + params.get("bankcode") + "|"
                + params.get("amount") + "|" + params.get("discountamount") + "|"
                + params.get("status");

        String expectedMac = generateHmacSha256(data, paymentConfig.getZalopay().getKey2());
        return expectedMac.equalsIgnoreCase(receivedMac);
    }

    @Override
    public String extractTransactionId(Map<String, String> params) {
        return params.get("zp_trans_id");
    }

    @Override
    public PaymentStatus extractStatus(Map<String, String> params) {
        String status = params.get("status");
        if (status != null && !"2".equals(status)) {
            return PaymentStatus.SUCCESS;
        }
        return PaymentStatus.FAILED;
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
            throw new RuntimeException("Failed to generate ZaloPay HMAC-SHA256 signature", e);
        }
    }

    private String callZaloPayApi(String url, Map<String, String> params) {
        try {
            StringBuilder postData = new StringBuilder();
            for (Map.Entry<String, String> entry : params.entrySet()) {
                if (postData.length() > 0) postData.append("&");
                postData.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8))
                        .append("=")
                        .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
            }

            java.net.URL obj = new java.net.URL(url);
            java.net.HttpURLConnection con = (java.net.HttpURLConnection) obj.openConnection();
            con.setRequestMethod("POST");
            con.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            con.setDoOutput(true);
            try (java.io.DataOutputStream wr = new java.io.DataOutputStream(con.getOutputStream())) {
                wr.writeBytes(postData.toString());
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
                    String json = response.toString();
                    // Try to extract orderurl from JSON
                    int urlIndex = json.indexOf("\"orderurl\":\"");
                    if (urlIndex == -1) urlIndex = json.indexOf("\"order_url\":\"");
                    if (urlIndex != -1) {
                        int start = urlIndex + 12;
                        int end = json.indexOf("\"", start);
                        return json.substring(start, end);
                    }
                    return json;
                }
            }
            throw new RuntimeException("ZaloPay API returned status: " + responseCode);
        } catch (Exception e) {
            throw new RuntimeException("Failed to call ZaloPay API", e);
        }
    }
}
