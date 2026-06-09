package com.httmdt.orientalherbs.controller.admin_api;

import com.httmdt.orientalherbs.dto.admin.DashboardStatsResponse;
import com.httmdt.orientalherbs.dto.admin.RevenueDataPoint;
import com.httmdt.orientalherbs.dto.admin.ReviewSentimentData;
import com.httmdt.orientalherbs.dto.admin.WordCloudData;
import com.httmdt.orientalherbs.dto.order.OrderListItemResponse;
import com.httmdt.orientalherbs.service.admin.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class DashboardAdminController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    @GetMapping("/recent-orders")
    public ResponseEntity<List<OrderListItemResponse>> getRecentOrders(
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getRecentOrders(limit, startDate, endDate));
    }

    @GetMapping("/revenue-chart")
    public ResponseEntity<List<RevenueDataPoint>> getRevenueChart(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getRevenueLast30Days(startDate, endDate));
    }

    @GetMapping("/review-sentiment")
    public ResponseEntity<List<ReviewSentimentData>> getReviewSentiment(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getReviewSentimentChart(startDate, endDate));
    }

    @GetMapping("/review-wordcloud")
    public ResponseEntity<List<WordCloudData>> getReviewWordCloud(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getReviewWordCloud(startDate, endDate));
    }
}
