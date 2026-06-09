package com.httmdt.orientalherbs.service.admin;

import com.httmdt.orientalherbs.dto.admin.DashboardStatsResponse;
import com.httmdt.orientalherbs.dto.admin.RevenueDataPoint;
import com.httmdt.orientalherbs.dto.admin.ReviewSentimentData;
import com.httmdt.orientalherbs.dto.admin.WordCloudData;
import com.httmdt.orientalherbs.dto.order.OrderListItemResponse;
import com.httmdt.orientalherbs.mapper.order.OrderMapper;
import com.httmdt.orientalherbs.model.enums.OrderStatus;
import com.httmdt.orientalherbs.model.enums.Sentiment;
import com.httmdt.orientalherbs.model.enums.UserRole;
import com.httmdt.orientalherbs.model.order.Order;
import com.httmdt.orientalherbs.dao.order.OrderRepository;
import com.httmdt.orientalherbs.dao.review.ProductReviewRepository;
import com.httmdt.orientalherbs.dao.user.UserRepository;
import com.httmdt.orientalherbs.dao.catalog.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductReviewRepository productReviewRepository;
    private final OrderMapper orderMapper;

    public DashboardStatsResponse getStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        long todayOrders = orderRepository.countTodayOrders(startOfDay);
        BigDecimal todayRevenue = orderRepository.calculateTodayRevenue(startOfDay);
        long newCustomers = userRepository.countNewCustomersToday(UserRole.ROLE_USER, startOfDay);
        long totalProducts = productRepository.count();
        long pendingOrders = orderRepository.countByOrderStatus(OrderStatus.PENDING);
        long processingOrders = orderRepository.countByOrderStatus(OrderStatus.CONFIRMED);
        long shippingOrders = orderRepository.countByOrderStatus(OrderStatus.SHIPPING);

        return DashboardStatsResponse.builder()
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .todayOrders(todayOrders)
                .todayRevenue(todayRevenue != null ? todayRevenue : BigDecimal.ZERO)
                .newCustomers(newCustomers)
                .totalProducts(totalProducts)
                .pendingOrders(pendingOrders)
                .processingOrders(processingOrders)
                .shippingOrders(shippingOrders)
                .build();
    }

    public List<OrderListItemResponse> getRecentOrders(int limit, LocalDate startDate, LocalDate endDate) {
        List<Order> orders;
        if (startDate != null && endDate != null) {
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
            orders = orderRepository.findRecentOrdersByDateRange(startDateTime, endDateTime, PageRequest.of(0, limit));
        } else {
            orders = orderRepository.findRecentOrders(PageRequest.of(0, limit));
        }
        return orders.stream()
                .map(orderMapper::toListItemResponse)
                .collect(Collectors.toList());
    }

    public List<RevenueDataPoint> getRevenueLast30Days(LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();
        LocalDate effectiveStartDate = startDate != null ? startDate : today.minusDays(30);
        LocalDate effectiveEndDate = endDate != null ? endDate : today;

        LocalDateTime startDateTime = effectiveStartDate.atStartOfDay();
        LocalDateTime endDateTime = effectiveEndDate.atTime(LocalTime.MAX);

        List<Object[]> results;
        if (startDate == null && endDate == null) {
            results = orderRepository.findRevenueByDateRange(startDateTime);
        } else {
            results = orderRepository.findRevenueByDateRange(startDateTime, endDateTime);
        }

        Map<String, RevenueDataPoint> dataPointMap = new LinkedHashMap<>();

        for (Object[] row : results) {
            String dateStr;
            Object dateObj = row[0];
            if (dateObj instanceof java.sql.Date sqlDate) {
                dateStr = sqlDate.toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
            } else if (dateObj instanceof LocalDate localDate) {
                dateStr = localDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
            } else {
                dateStr = dateObj.toString();
            }
            BigDecimal revenue = row[1] instanceof BigDecimal ? (BigDecimal) row[1] : new BigDecimal(row[1].toString());
            Long orderCount = (Long) row[2];

            dataPointMap.put(dateStr, RevenueDataPoint.builder()
                    .date(dateStr)
                    .revenue(revenue)
                    .orderCount(orderCount)
                    .build());
        }

        for (LocalDate date = effectiveStartDate; !date.isAfter(effectiveEndDate); date = date.plusDays(1)) {
            String dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE);
            dataPointMap.putIfAbsent(dateStr, RevenueDataPoint.builder()
                    .date(dateStr)
                    .revenue(BigDecimal.ZERO)
                    .orderCount(0L)
                    .build());
        }

        return dataPointMap.values().stream().collect(Collectors.toList());
    }

    public List<ReviewSentimentData> getReviewSentimentChart(LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();
        LocalDate effectiveStartDate = startDate != null ? startDate : today.minusDays(30);
        LocalDate effectiveEndDate = endDate != null ? endDate : today;

        LocalDateTime startDateTime = effectiveStartDate.atStartOfDay();
        LocalDateTime endDateTime = effectiveEndDate.atTime(LocalTime.MAX);

        List<Object[]> results = productReviewRepository.countBySentimentInDateRange(startDateTime, endDateTime);

        Map<Sentiment, Long> sentimentMap = new LinkedHashMap<>();
        sentimentMap.put(Sentiment.POSITIVE, 0L);
        sentimentMap.put(Sentiment.NEUTRAL, 0L);
        sentimentMap.put(Sentiment.NEGATIVE, 0L);

        for (Object[] row : results) {
            Sentiment sentiment = (Sentiment) row[0];
            Long count = (Long) row[1];
            if (sentiment != null) {
                sentimentMap.put(sentiment, count);
            }
        }

        return sentimentMap.entrySet().stream()
                .map(entry -> ReviewSentimentData.builder()
                        .name(getSentimentLabel(entry.getKey()))
                        .value(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private String getSentimentLabel(Sentiment sentiment) {
        return switch (sentiment) {
            case POSITIVE -> "Tích cực";
            case NEUTRAL -> "Trung lập";
            case NEGATIVE -> "Tiêu cực";
        };
    }

    public List<WordCloudData> getReviewWordCloud(LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();
        LocalDate effectiveStartDate = startDate != null ? startDate : today.minusDays(30);
        LocalDate effectiveEndDate = endDate != null ? endDate : today;

        LocalDateTime startDateTime = effectiveStartDate.atStartOfDay();
        LocalDateTime endDateTime = effectiveEndDate.atTime(LocalTime.MAX);

        List<List<String>> keywordLists = productReviewRepository.findAllKeywordsInDateRange(startDateTime, endDateTime);

        Map<String, Integer> wordCount = new LinkedHashMap<>();
        for (List<String> keywords : keywordLists) {
            if (keywords != null) {
                for (String keyword : keywords) {
                    if (keyword != null && !keyword.isBlank()) {
                        String normalizedKeyword = keyword.trim().toLowerCase();
                        wordCount.merge(normalizedKeyword, 1, Integer::sum);
                    }
                }
            }
        }

        return wordCount.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(50)
                .map(entry -> WordCloudData.builder()
                        .text(entry.getKey())
                        .value(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }
}
