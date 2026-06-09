package com.httmdt.orientalherbs.service.auth;

import com.httmdt.orientalherbs.dao.user.PasswordResetTokenRepository;
import com.httmdt.orientalherbs.dao.user.UserRepository;
import com.httmdt.orientalherbs.model.user.PasswordResetToken;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.service.email.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
public class ForgotPasswordService {

    private static final int OTP_LENGTH = 6;
    private static final int OTP_VALID_MINUTES = 10;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public void requestOtp(String email) {
        // Only find users with LOCAL auth provider (Google users can't reset password via this flow)
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            // Always return success to prevent email enumeration
            return;
        }

        User user = userOpt.get();
        if (user.getAuthProvider() != com.httmdt.orientalherbs.model.enums.AuthProvider.LOCAL) {
            // Google users don't have a password
            return;
        }

        // Invalidate previous tokens for this email
        tokenRepository.deleteByEmail(email);

        // Generate 6-digit OTP
        String otpCode = generateOtp();

        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(email);
        token.setOtpCode(otpCode);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_VALID_MINUTES));
        token.setUsed(false);
        token.setAttempts(0);
        tokenRepository.save(token);

        // Send email asynchronously
        try {
            emailService.sendEmailAsync(email, "FORGOT_PASSWORD", Map.of(
                "fullName", user.getFullName(),
                "otpCode", otpCode,
                "expiresIn", OTP_VALID_MINUTES + " phút"
            ));
        } catch (Exception e) {
            System.err.println("[FORGOT_PASSWORD] Failed to send OTP email to " + email + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public void resetPassword(String email, String otpCode, String newPassword) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByEmailAndOtpCode(email, otpCode);

        if (tokenOpt.isEmpty()) {
            throw new RuntimeException("Mã OTP không hợp lệ.");
        }

        PasswordResetToken token = tokenOpt.get();

        if (!token.isValid()) {
            if (token.isExpired()) {
                throw new RuntimeException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
            }
            if (token.isUsed()) {
                throw new RuntimeException("Mã OTP đã được sử dụng.");
            }
            throw new RuntimeException("Mã OTP không hợp lệ.");
        }

        if (!token.incrementAttempts()) {
            // Mark as used after too many attempts
            token.setUsed(true);
            tokenRepository.save(token);
            throw new RuntimeException("Đã nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.");
        }

        // Find user and update password
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Người dùng không tồn tại.");
        }

        User user = userOpt.get();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        token.setUsed(true);
        tokenRepository.save(token);

        // Also delete expired/used tokens cleanup
        tokenRepository.deleteExpiredAndUsed(LocalDateTime.now());
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = random.nextInt((int) Math.pow(10, OTP_LENGTH));
        return String.format("%0" + OTP_LENGTH + "d", otp);
    }
}
