package com.httmdt.orientalherbs.dao.returns;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.returns.ReturnRequest;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    @Query("SELECT r FROM ReturnRequest r WHERE r.order.order_id = :orderId")
    java.util.Optional<ReturnRequest> findByOrderId(@Param("orderId") Long orderId);

    // Lấy danh sách yêu cầu trả hàng của user
    @Query("SELECT r FROM ReturnRequest r WHERE r.user.userId = :userId ORDER BY r.createdAt DESC")
    Page<ReturnRequest> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT r FROM ReturnRequest r LEFT JOIN FETCH r.returnItems ri LEFT JOIN FETCH ri.orderItem WHERE r.id = :id")
    java.util.Optional<ReturnRequest> findByIdWithItems(@Param("id") Long id);
}
