package com.httmdt.orientalherbs.controller.payment;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.httmdt.orientalherbs.dto.payment.PaymentInitResponse;
import com.httmdt.orientalherbs.dto.payment.PaymentStatusResponse;
import com.httmdt.orientalherbs.model.enums.PaymentMethod;
import com.httmdt.orientalherbs.service.payment.PaymentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/init")
    public ResponseEntity<PaymentInitResponse> initPayment(@RequestBody Map<String, Object> request) {
        Long orderId = Long.valueOf(request.get("orderId").toString());
        PaymentMethod method = PaymentMethod.valueOf(request.get("method").toString());
        PaymentInitResponse response = paymentService.initPayment(orderId, method);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<PaymentStatusResponse> getPaymentStatus(@PathVariable Long orderId) {
        PaymentStatusResponse response = paymentService.getPaymentStatus(orderId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/{orderId}/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> confirmPayment(@PathVariable Long orderId) {
        paymentService.confirmPayment(orderId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/vnpay/ipn")
    public ResponseEntity<String> handleVnpayIpn(@RequestParam Map<String, String> params) {
        try {
            Map<String, String> paramMap = new HashMap<>(params);
            paymentService.handleVnpayIpn(paramMap);
            return ResponseEntity.ok()
                    .header("Content-Type", "text/plain; charset=utf-8")
                    .body("RspCode=00&Message=Confirm Success");
        } catch (Exception e) {
            return ResponseEntity.ok()
                    .header("Content-Type", "text/plain; charset=utf-8")
                    .body("RspCode=99&Message=Error");
        }
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<Map<String, String>> handleVnpayReturn(@RequestParam Map<String, String> params) {
        try {
            Map<String, String> result = paymentService.handleVnpayReturn(params);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/momo/ipn")
    public ResponseEntity<String> handleMomoIpn(@RequestBody Map<String, String> params) {
        try {
            paymentService.handleMomoIpn(params);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("ERROR");
        }
    }

    @PostMapping("/zalopay/ipn")
    public ResponseEntity<String> handleZaloPayIpn(@RequestBody Map<String, String> params) {
        try {
            paymentService.handleZaloPayIpn(params);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("ERROR");
        }
    }
}
