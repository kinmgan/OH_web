package com.httmdt.orientalherbs.dao.order;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.order.Order;
import com.httmdt.orientalherbs.model.enums.OrderStatus;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Lấy danh sách đơn hàng của user
    @Query("SELECT o FROM Order o WHERE o.user.userId = :userId ORDER BY o.createdAt DESC")
    Page<Order> findByUserId(@Param("userId") Long userId, Pageable pageable);

    // Lấy danh sách đơn hàng của user theo status
    @Query("SELECT o FROM Order o WHERE o.user.userId = :userId AND o.orderStatus = :status ORDER BY o.createdAt DESC")
    Page<Order> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") OrderStatus status, Pageable pageable);

    // Lấy danh sách tất cả đơn hàng (cho admin)
    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    Page<Order> findAllOrders(Pageable pageable);

    // Lấy danh sách đơn hàng theo status (cho admin)
    @Query("SELECT o FROM Order o WHERE o.orderStatus = :status ORDER BY o.createdAt DESC")
    Page<Order> findByStatus(@Param("status") OrderStatus status, Pageable pageable);

    // Tìm đơn hàng chi tiết
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH o.payment WHERE o.order_id = :orderId")
    Order findOrderWithDetails(@Param("orderId") Long orderId);



    // Dashboard: Total revenue (all delivered/cancelled orders, excluding cancelled which were refunded)
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderStatus <> 'CANCELLED'")
    java.math.BigDecimal calculateTotalRevenue();

    // Dashboard: Today's orders count
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :startOfDay")
    long countTodayOrders(@Param("startOfDay") LocalDateTime startOfDay);

    // Dashboard: Today's revenue
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.createdAt >= :startOfDay AND o.orderStatus <> 'CANCELLED'")
    java.math.BigDecimal calculateTodayRevenue(@Param("startOfDay") LocalDateTime startOfDay);

    // Dashboard: Count orders by status
    long countByOrderStatus(OrderStatus status);

    // Dashboard: Recent orders (last N, ordered by createdAt desc)
    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findRecentOrders(Pageable pageable);

    // Dashboard: Recent orders with date range filter
    @Query("SELECT o FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate ORDER BY o.createdAt DESC")
    List<Order> findRecentOrdersByDateRange(@Param("startDate") LocalDateTime startDate,
                                            @Param("endDate") LocalDateTime endDate,
                                            Pageable pageable);

    // Dashboard: Revenue by date range (for chart)
    @Query("SELECT CAST(o.createdAt AS LocalDate) as date, SUM(o.totalAmount) as revenue, COUNT(o) as orderCount " +
           "FROM Order o WHERE o.createdAt >= :startDate AND o.orderStatus <> 'CANCELLED' " +
           "GROUP BY CAST(o.createdAt AS LocalDate) ORDER BY date")
    List<Object[]> findRevenueByDateRange(@Param("startDate") LocalDateTime startDate);

    // Dashboard: Revenue by date range with end date
    @Query("SELECT CAST(o.createdAt AS LocalDate) as date, SUM(o.totalAmount) as revenue, COUNT(o) as orderCount " +
           "FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate AND o.orderStatus <> 'CANCELLED' " +
           "GROUP BY CAST(o.createdAt AS LocalDate) ORDER BY date")
    List<Object[]> findRevenueByDateRange(@Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate);
}
