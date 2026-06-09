package com.httmdt.orientalherbs.dao.user;

import com.httmdt.orientalherbs.model.user.EmailChangeToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface EmailChangeTokenRepository extends JpaRepository<EmailChangeToken, Long> {

    Optional<EmailChangeToken> findByUserIdAndNewEmailAndOtpCode(Long userId, String newEmail, String otpCode);

    @Modifying
    @Query("DELETE FROM EmailChangeToken t WHERE t.userId = :userId AND t.newEmail = :newEmail")
    void deleteByUserIdAndNewEmail(@Param("userId") Long userId, @Param("newEmail") String newEmail);

    @Modifying
    @Query("DELETE FROM EmailChangeToken t WHERE t.expiresAt < :now OR t.used = true")
    void deleteExpiredAndUsed(@Param("now") LocalDateTime now);
}
