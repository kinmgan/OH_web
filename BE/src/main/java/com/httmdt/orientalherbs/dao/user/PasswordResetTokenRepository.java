package com.httmdt.orientalherbs.dao.user;

import com.httmdt.orientalherbs.model.user.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findTopByEmailOrderByCreatedAtDesc(String email);

    Optional<PasswordResetToken> findByOtpCode(String otpCode);

    Optional<PasswordResetToken> findByEmailAndOtpCode(String email, String otpCode);

    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.expiresAt < :now OR p.used = true")
    void deleteExpiredAndUsed(LocalDateTime now);

    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.email = :email")
    void deleteByEmail(String email);
}
