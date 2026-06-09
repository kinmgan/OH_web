package com.httmdt.orientalherbs.dao.order;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.order.Payment;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    @Query("SELECT p FROM Payment p WHERE p.order.order_id = :orderId")
    Optional<Payment> findByOrderOrder_id(@Param("orderId") Long orderId);

    Optional<Payment> findByTransactionId(String transactionId);
}
