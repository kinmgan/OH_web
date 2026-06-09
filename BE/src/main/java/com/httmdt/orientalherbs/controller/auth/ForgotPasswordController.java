package com.httmdt.orientalherbs.controller.auth;

import com.httmdt.orientalherbs.dto.auth.ForgotPasswordRequest;
import com.httmdt.orientalherbs.dto.auth.ResetPasswordRequest;
import com.httmdt.orientalherbs.service.auth.ForgotPasswordService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class ForgotPasswordController {

    @Autowired
    private ForgotPasswordService forgotPasswordService;

    /**
     * Request OTP for password reset.
     * Sends email with 6-digit OTP if user exists.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        forgotPasswordService.requestOtp(request.getEmail());
        // Always return success to prevent email enumeration
        return ResponseEntity.ok(Map.of(
            "message", "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi."
        ));
    }

    /**
     * Reset password using OTP.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        forgotPasswordService.resetPassword(request.getEmail(), request.getOtpCode(), request.getNewPassword());
        return ResponseEntity.ok(Map.of(
            "message", "Mật khẩu đã được đặt lại thành công."
        ));
    }
}
