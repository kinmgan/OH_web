package com.httmdt.orientalherbs.dao.user;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.enums.UserRole;
import com.httmdt.orientalherbs.model.user.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndUserIdNot(String email, Long userId);

    @Query("""
            SELECT u.userId AS id,
                   u.fullName AS fullName,
                   u.email AS email,
                   u.phoneNumber AS phoneNumber,
                   COUNT(o) AS orderCount,
                   COALESCE(SUM(o.totalAmount), 0) AS totalSpent,
                   u.createdAt AS createdAt
            FROM User u
            LEFT JOIN u.orders o
            WHERE u.role = :role
              AND (
                  TRIM(CAST(:keyword AS text)) = ''
                  OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', TRIM(CAST(:keyword AS text)), '%'))
                  OR LOWER(u.email) LIKE LOWER(CONCAT('%', TRIM(CAST(:keyword AS text)), '%'))
                  OR LOWER(COALESCE(u.phoneNumber, '')) LIKE LOWER(CONCAT('%', TRIM(CAST(:keyword AS text)), '%'))
              )
            GROUP BY u.userId, u.fullName, u.email, u.phoneNumber, u.createdAt
            """)
    Page<UserCustomerSummaryProjection> searchCustomers(
            @Param("role") UserRole role,
            @Param("keyword") String keyword,
            Pageable pageable);

    long countByUserIdAndRole(Long userId, UserRole role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.createdAt >= :startOfDay")
    long countNewCustomersToday(@Param("role") UserRole role, @Param("startOfDay") LocalDateTime startOfDay);

    long countByRole(UserRole role);

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.email IS NOT NULL AND u.email <> ''")
    List<User> findAllUsersWithRole(@Param("role") UserRole role);
}
