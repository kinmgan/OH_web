package com.httmdt.orientalherbs.service.payment;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.httmdt.orientalherbs.dao.order.OrderRepository;
import com.httmdt.orientalherbs.dao.order.PaymentRepository;
import com.httmdt.orientalherbs.dto.payment.PaymentInitResponse;
import com.httmdt.orientalherbs.dto.payment.PaymentStatusResponse;
import com.httmdt.orientalherbs.model.enums.PaymentMethod;
import com.httmdt.orientalherbs.model.enums.PaymentStatus;
import com.httmdt.orientalherbs.model.order.Order;
import com.httmdt.orientalherbs.model.order.Payment;
import com.httmdt.orientalherbs.service.payment.gateway.BankTransferGateway;
import com.httmdt.orientalherbs.service.payment.gateway.MomoGateway;
import com.httmdt.orientalherbs.service.payment.gateway.PaymentGateway;
import com.httmdt.orientalherbs.service.payment.gateway.VnpayGateway;
import com.httmdt.orientalherbs.service.payment.gateway.ZaloPayGateway;
import com.httmdt.orientalherbs.service.email.EmailService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final VnpayGateway vnpayGateway;
    private final MomoGateway momoGateway;
    private final ZaloPayGateway zaloPayGateway;
    private final BankTransferGateway bankTransferGateway;
    private final EmailService emailService;

    @Override
    @Transactional
    public PaymentInitResponse initPayment(Long orderId, PaymentMethod method) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        Payment payment = paymentRepository.findByOrderOrder_id(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        String returnUrl = buildReturnUrl(orderId);

        PaymentGateway gateway = selectGateway(method);
        PaymentInitResponse response = gateway.createPaymentUrl(order, payment.getAmount().longValue(), returnUrl);

        payment.setPaymentUrl(response.getPaymentUrl());
        if (response.getExpiredAt() != null) {
            payment.setExpiredAt(response.getExpiredAt());
        }
        paymentRepository.save(payment);

        return response;
    }

    @Override
    public PaymentStatusResponse getPaymentStatus(Long orderId) {
        Payment payment = paymentRepository.findByOrderOrder_id(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        return PaymentStatusResponse.builder()
                .orderId(orderId)
                .paymentStatus(payment.getPaymentStatus())
                .message(getStatusMessage(payment.getPaymentStatus()))
                .build();
    }

    @Override
    @Transactional
    public void confirmPayment(Long orderId) {
        Payment payment = paymentRepository.findByOrderOrder_id(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        PaymentStatus oldStatus = payment.getPaymentStatus();
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);
        
        if (oldStatus != PaymentStatus.SUCCESS) {
            sendOrderSuccessEmail(payment.getOrder(), payment.getPaymentMethod());
        }
    }

    @Override
    @Transactional
    public void handleVnpayIpn(Map<String, String> params) {
        if (!vnpayGateway.verifyWebhook(params)) {
            throw new RuntimeException("Invalid VNPay IPN signature");
        }

        String txnRef = params.get("vnp_TxnRef");
        // txnRef format: orderId_timestamp
        Long orderId = Long.parseLong(txnRef.split("_")[0]);

        Payment payment = paymentRepository.findByOrderOrder_id(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        payment.setTransactionId(vnpayGateway.extractTransactionId(params));
        payment.setGatewayResponse(params.toString());
        
        PaymentStatus oldStatus = payment.getPaymentStatus();
        PaymentStatus newStatus = vnpayGateway.extractStatus(params);
        payment.setPaymentStatus(newStatus);

        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            payment.setPaidAt(LocalDateTime.now());
        }

        paymentRepository.save(payment);
        
        if (oldStatus != PaymentStatus.SUCCESS && newStatus == PaymentStatus.SUCCESS) {
            sendOrderSuccessEmail(payment.getOrder(), payment.getPaymentMethod());
        }
    }

    @Override
    @Transactional
    public Map<String, String> handleVnpayReturn(Map<String, String> params) {
        // 1. Verify signature from VNPay
        if (!vnpayGateway.verifyWebhook(params)) {
            throw new RuntimeException("Invalid VNPay return signature");
        }

        // 2. Extract order ID from vnp_TxnRef (format: orderId_timestamp)
        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isEmpty()) {
            throw new RuntimeException("Missing vnp_TxnRef");
        }
        Long orderId = Long.parseLong(txnRef.split("_")[0]);

        // 3. Validate order exists and payment not already processed
        // Variable used to ensure order exists before updating payment
        @SuppressWarnings("unused")
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        // 4. Update payment record (idempotent: skip if already SUCCESS)
        Payment payment = paymentRepository.findByOrderOrder_id(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            Map<String, String> result = new HashMap<>();
            result.put("orderId", String.valueOf(orderId));
            result.put("status", "success");
            result.put("responseCode", params.get("vnp_ResponseCode") != null ? params.get("vnp_ResponseCode") : "");
            result.put("transactionStatus", params.get("vnp_TransactionStatus") != null ? params.get("vnp_TransactionStatus") : "");
            return result;
        }

        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");

        payment.setTransactionId(vnpayGateway.extractTransactionId(params));
        payment.setGatewayResponse(params.toString());

        PaymentStatus oldStatus = payment.getPaymentStatus();
        boolean isSuccess = "00".equals(responseCode) && "00".equals(transactionStatus);
        if (isSuccess) {
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());
        } else {
            payment.setPaymentStatus(PaymentStatus.FAILED);
        }
        paymentRepository.save(payment);

        if (oldStatus != PaymentStatus.SUCCESS && isSuccess) {
            sendOrderSuccessEmail(payment.getOrder(), payment.getPaymentMethod());
        }

        // 5. Build result map for frontend redirect
        Map<String, String> result = new HashMap<>();
        result.put("orderId", String.valueOf(orderId));
        result.put("status", isSuccess ? "success" : "failed");
        result.put("responseCode", responseCode != null ? responseCode : "");
        result.put("transactionStatus", transactionStatus != null ? transactionStatus : "");
        return result;
    }

    @Override
    @Transactional
    public void handleMomoIpn(Map<String, String> params) {
        if (!momoGateway.verifyWebhook(params)) {
            throw new RuntimeException("Invalid MoMo IPN signature");
        }

        String orderIdStr = params.get("orderId");
        // MoMo orderId format: MOMO{orderId}_{timestamp}
        // Extract the numeric order ID
        Long orderId = extractNumericOrderId(orderIdStr);

        Payment payment = paymentRepository.findByOrderOrder_id(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        payment.setTransactionId(momoGateway.extractTransactionId(params));
        payment.setGatewayResponse(params.toString());
        
        PaymentStatus oldStatus = payment.getPaymentStatus();
        PaymentStatus newStatus = momoGateway.extractStatus(params);
        payment.setPaymentStatus(newStatus);

        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            payment.setPaidAt(LocalDateTime.now());
        }

        paymentRepository.save(payment);
        
        if (oldStatus != PaymentStatus.SUCCESS && newStatus == PaymentStatus.SUCCESS) {
            sendOrderSuccessEmail(payment.getOrder(), payment.getPaymentMethod());
        }
    }

    @Override
    @Transactional
    public void handleZaloPayIpn(Map<String, String> params) {
        if (!zaloPayGateway.verifyWebhook(params)) {
            throw new RuntimeException("Invalid ZaloPay IPN signature");
        }

        String appTransId = params.get("apptransid");
        // Format: yyMMdd_ORDERID — extract order ID after the date prefix
        int underscoreIdx = appTransId.indexOf('_');
        Long orderId = Long.parseLong(appTransId.substring(underscoreIdx + 1));

        Payment payment = paymentRepository.findByOrderOrder_id(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        payment.setTransactionId(zaloPayGateway.extractTransactionId(params));
        payment.setGatewayResponse(params.toString());
        
        PaymentStatus oldStatus = payment.getPaymentStatus();
        PaymentStatus newStatus = zaloPayGateway.extractStatus(params);
        payment.setPaymentStatus(newStatus);

        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            payment.setPaidAt(LocalDateTime.now());
        }

        paymentRepository.save(payment);
        
        if (oldStatus != PaymentStatus.SUCCESS && newStatus == PaymentStatus.SUCCESS) {
            sendOrderSuccessEmail(payment.getOrder(), payment.getPaymentMethod());
        }
    }

    private String buildReturnUrl(Long orderId) {
        return "http://localhost:3000/dat-hang/" + orderId + "/thanh-toan/result";
    }

    private PaymentGateway selectGateway(PaymentMethod method) {
        return switch (method) {
            case VNPAY -> vnpayGateway;
            case MOMO -> momoGateway;
            case ZALOPAY -> zaloPayGateway;
            case BANK_TRANSFER -> bankTransferGateway;
            default -> throw new RuntimeException("Unsupported payment method: " + method);
        };
    }

    private Long extractNumericOrderId(String str) {
        if (str == null) throw new RuntimeException("Invalid orderId string");
        StringBuilder sb = new StringBuilder();
        for (char c : str.toCharArray()) {
            if (Character.isDigit(c)) sb.append(c);
        }
        if (sb.length() == 0) throw new RuntimeException("No numeric order ID found in: " + str);
        return Long.parseLong(sb.toString());
    }

    private String getStatusMessage(PaymentStatus status) {
        return switch (status) {
            case PENDING -> "Dang cho thanh toan";
            case SUCCESS -> "Thanh toan thanh cong";
            case FAILED -> "Thanh toan that bai";
            case REFUNDED -> "Da hoan tien";
        };
    }

    private void sendOrderSuccessEmail(Order order, PaymentMethod paymentMethod) {
        try {
            Map<String, String> variables = new HashMap<>();
            variables.put("fullName", order.getUser().getFullName() != null ? order.getUser().getFullName() : "Khách hàng");
            variables.put("orderId", String.valueOf(order.getOrder_id()));
            variables.put("totalAmount", formatPrice(order.getTotalAmount()));
            variables.put("paymentMethod", getPaymentMethodLabel(paymentMethod));
            variables.put("shippingAddress", order.getAddressDetail() != null ? order.getAddressDetail() : "");
            
            emailService.sendEmailAsync(
                order.getUser().getEmail(),
                "ORDER_SUCCESS",
                variables
            );
        } catch (Exception e) {
            System.err.println("Failed to send order success email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String formatPrice(java.math.BigDecimal amount) {
        if (amount == null) return "0";
        java.text.NumberFormat nf = java.text.NumberFormat.getInstance(new java.util.Locale("vi", "VN"));
        return nf.format(amount) + " ₫";
    }

    private String getPaymentMethodLabel(PaymentMethod method) {
        if (method == null) return "Không xác định";
        return switch (method) {
            case COD -> "Thanh toán khi nhận hàng (COD)";
            case BANK_TRANSFER -> "Chuyển khoản ngân hàng";
            case VNPAY -> "VNPAY";
            case MOMO -> "MoMo";
            case ZALOPAY -> "ZaloPay";
            default -> "Không xác định";
        };
    }
}
