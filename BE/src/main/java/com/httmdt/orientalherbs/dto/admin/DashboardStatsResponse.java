package com.httmdt.orientalherbs.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private BigDecimal totalRevenue;
    private long todayOrders;
    private BigDecimal todayRevenue;
    private long newCustomers;
    private long totalProducts;
    private long pendingOrders;
    private long processingOrders;
    private long shippingOrders;
}
