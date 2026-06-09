package com.httmdt.orientalherbs.dao.returns;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.returns.RefundTransaction;

import java.util.Optional;

@Repository
public interface RefundTransactionRepository extends JpaRepository<RefundTransaction, Long> {
    Optional<RefundTransaction> findByReturnRequestId(Long returnRequestId);
}
