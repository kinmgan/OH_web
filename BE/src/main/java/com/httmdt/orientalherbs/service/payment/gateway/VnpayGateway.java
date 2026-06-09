package com.httmdt.orientalherbs.service.payment.gateway;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

import org.springframework.stereotype.Component;

import com.httmdt.orientalherbs.config.PaymentConfig;
import com.httmdt.orientalherbs.dto.payment.PaymentInitResponse;
import com.httmdt.orientalherbs.model.enums.PaymentMethod;
import com.httmdt.orientalherbs.model.enums.PaymentStatus;
import com.httmdt.orientalherbs.model.order.Order;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@Slf4j
@Component
@RequiredArgsConstructor
public class VnpayGateway implements PaymentGateway {

    private final PaymentConfig paymentConfig;

    private static final String HASH_ALGORITHM = "HmacSHA512";

    @Override
    public PaymentInitResponse createPaymentUrl(Order order, Long amount, String returnUrl) {
        PaymentConfig.Vnpay vnpay = paymentConfig.getVnpay();

        String vnpVersion = "2.1.0";
        String vnpCommand = "pay";
        String vnpTxnRef = String.valueOf(order.getOrder_id()) + "_" + System.currentTimeMillis();
        long vnpAmount = amount * 100; // VNPay uses amount in "xu" (VND * 100)
        String vnpCurrCode = "VND";
        String vnpOrderInfo = "Thanh toan don hang ORH" + order.getOrder_id();
        String vnpIpAddr = "127.0.0.1";

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnpCreateDate = formatter.format(cld.getTime());
        cld.add(Calendar.MINUTE, 15);
        String vnpExpireDate = formatter.format(cld.getTime());

        String vnpLocale = "vn";

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", vnpVersion);
        vnpParams.put("vnp_Command", vnpCommand);
        vnpParams.put("vnp_TmnCode", vnpay.getTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(vnpAmount));
        vnpParams.put("vnp_CurrCode", vnpCurrCode);
        vnpParams.put("vnp_TxnRef", vnpTxnRef);
        vnpParams.put("vnp_OrderInfo", vnpOrderInfo);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", vnpLocale);
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_IpAddr", vnpIpAddr);
        vnpParams.put("vnp_CreateDate", vnpCreateDate);
        vnpParams.put("vnp_ExpireDate", vnpExpireDate);
        // vnp_BankCode is intentionally NOT added when empty,
        // per VNPay official docs: let user choose on VNPAY page

        // Build data to hash and query string — following VNPay official Java demo exactly
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                // Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                // Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        String queryUrl = query.toString();
        String vnpSecureHash = hmacSHA512(vnpay.getHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnpSecureHash;
        String paymentUrl = vnpay.getUrl() + "?" + queryUrl;

        log.info("VNPay TmnCode: {}", vnpay.getTmnCode());
        log.info("VNPay HashSecret length={}, first4={}, last4={}", 
            vnpay.getHashSecret().length(),
            vnpay.getHashSecret().substring(0, 4),
            vnpay.getHashSecret().substring(vnpay.getHashSecret().length() - 4));
        log.info("VNPay hashData: {}", hashData.toString());
        log.info("VNPay SecureHash: {}", vnpSecureHash);
        log.info("VNPay Payment URL: {}", paymentUrl);

        return PaymentInitResponse.builder()
                .paymentUrl(paymentUrl)
                .orderId(order.getOrder_id())
                .expiredAt(cld.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime())
                .method(PaymentMethod.VNPAY)
                .build();
    }

    @Override
    public boolean verifyWebhook(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null) return false;

        Map<String, String> fields = new TreeMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!entry.getKey().equals("vnp_SecureHash") && !"vnp_SecureHashType".equals(entry.getKey())) {
                fields.put(entry.getKey(), entry.getValue());
            }
        }

        // Build hash data the same way as VNPay official demo
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }

        String expectedHash = hmacSHA512(paymentConfig.getVnpay().getHashSecret(), hashData.toString());
        return expectedHash.equalsIgnoreCase(receivedHash);
    }

    @Override
    public String extractTransactionId(Map<String, String> params) {
        return params.get("vnp_TransactionNo");
    }

    @Override
    public PaymentStatus extractStatus(Map<String, String> params) {
        String responseCode = params.get("vnp_ResponseCode");
        if ("00".equals(responseCode)) {
            return PaymentStatus.SUCCESS;
        }
        return PaymentStatus.FAILED;
    }

    /**
     * HMAC SHA512 — matches VNPay Config.hmacSHA512() exactly
     */
    private String hmacSHA512(String key, String data) {
        try {
            if (key == null || data == null) {
                throw new RuntimeException("key or data is null");
            }
            Mac hmac512 = Mac.getInstance(HASH_ALGORITHM);
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, HASH_ALGORITHM);
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Failed to generate VNPay secure hash", e);
        }
    }
}
