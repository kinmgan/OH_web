package com.httmdt.orientalherbs.model.returns;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import com.httmdt.orientalherbs.model.enums.ReturnReason;
import com.httmdt.orientalherbs.model.enums.ReturnStatus;
import com.httmdt.orientalherbs.model.order.Order;
import com.httmdt.orientalherbs.model.user.User;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "return_requests")
public class ReturnRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReturnReason reason; 

    @Column(columnDefinition = "TEXT")
    private String description; 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReturnStatus status; 

    @ElementCollection
    @CollectionTable(name = "return_evidence_images", joinColumns = @JoinColumn(name = "return_request_id"))
    @Column(name = "image_url")
    private List<String> evidenceImages = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; 

    @OneToMany(mappedBy = "returnRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReturnItem> returnItems = new ArrayList<>();

    @OneToOne(mappedBy = "returnRequest", cascade = CascadeType.ALL)
    private RefundTransaction refundTransaction;
}