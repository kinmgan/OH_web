package com.httmdt.orientalherbs.dao.user;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface UserCustomerSummaryProjection {
    Long getId();
    String getFullName();
    String getEmail();
    String getPhoneNumber();
    Long getOrderCount();
    BigDecimal getTotalSpent();
    LocalDateTime getCreatedAt();
}
