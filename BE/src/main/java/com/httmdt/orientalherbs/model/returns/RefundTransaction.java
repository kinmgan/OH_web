package com.httmdt.orientalherbs.model.returns;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.httmdt.orientalherbs.model.enums.RefundStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "refund_transactions")
public class RefundTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    @Column(nullable = false)
    private BigDecimal amount; 

    @Column(name = "refund_method", nullable = false)
    private String refundMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RefundStatus status;

    @Column(name = "transaction_id")
    private String transactionId; 

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "reason")
    private String reason;

    @Column(name = "proof_image")
    private String proofImage;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_request_id", nullable = false)
    private ReturnRequest returnRequest;
}