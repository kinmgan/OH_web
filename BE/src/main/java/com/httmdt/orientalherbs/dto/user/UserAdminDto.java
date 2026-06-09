package com.httmdt.orientalherbs.dto.user;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminDto {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private Long orderCount;
    private BigDecimal totalSpent;
    private LocalDateTime createdAt;
}
