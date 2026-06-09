package com.httmdt.orientalherbs.service.user;

import com.httmdt.orientalherbs.dao.user.EmailChangeTokenRepository;
import com.httmdt.orientalherbs.dao.user.UserRepository;
import com.httmdt.orientalherbs.model.user.EmailChangeToken;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.service.email.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
public class EmailChangeService {

    private static final int OTP_LENGTH = 6;
    private static final int OTP_VALID_MINUTES = 10;

    @Autowired
    private EmailChangeTokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Transactional
    public void requestOtp(Long userId, String newEmail) {
        // Check if user exists
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Người dùng không tồn tại.");
        }
        User user = userOpt.get();

        // Ensure new email is not the same as current
        if (user.getEmail().equalsIgnoreCase(newEmail)) {
            throw new RuntimeException("Email mới không được trùng với email hiện tại.");
        }

        // Check if new email is already in use by another user
        Optional<User> existingUser = userRepository.findByEmail(newEmail);
        if (existingUser.isPresent()) {
            throw new RuntimeException("Email này đã được sử dụng bởi một tài khoản khác.");
        }

        // Invalidate previous tokens for this user and newEmail
        tokenRepository.deleteByUserIdAndNewEmail(userId, newEmail);

        // Generate 6-digit OTP
        String otpCode = generateOtp();

        EmailChangeToken token = new EmailChangeToken();
        token.setUserId(userId);
        token.setNewEmail(newEmail);
        token.setOtpCode(otpCode);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_VALID_MINUTES));
        token.setUsed(false);
        token.setAttempts(0);
        tokenRepository.save(token);

        // Send email asynchronously
        try {
            emailService.sendEmailAsync(newEmail, "CHANGE_EMAIL_OTP", Map.of(
                "fullName", user.getFullName(),
                "otpCode", otpCode,
                "expiresIn", OTP_VALID_MINUTES + " phút"
            ));
        } catch (Exception e) {
            System.err.println("[CHANGE_EMAIL] Failed to send OTP email to " + newEmail + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public void verifyAndChangeEmail(Long userId, String newEmail, String otpCode) {
        Optional<EmailChangeToken> tokenOpt = tokenRepository.findByUserIdAndNewEmailAndOtpCode(userId, newEmail, otpCode);

        if (tokenOpt.isEmpty()) {
            throw new RuntimeException("Mã OTP không hợp lệ.");
        }

        EmailChangeToken token = tokenOpt.get();

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

        // Find user and update email
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Người dùng không tồn tại.");
        }

        // Check again if new email is taken in the meantime
        Optional<User> existingUser = userRepository.findByEmail(newEmail);
        if (existingUser.isPresent()) {
            throw new RuntimeException("Email này đã được sử dụng bởi một tài khoản khác.");
        }

        User user = userOpt.get();
        user.setEmail(newEmail);
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
