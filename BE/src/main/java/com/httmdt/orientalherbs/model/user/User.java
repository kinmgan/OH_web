package com.httmdt.orientalherbs.model.user;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import com.httmdt.orientalherbs.model.cart.Cart;
import com.httmdt.orientalherbs.model.enums.PaymentMethod;
import com.httmdt.orientalherbs.model.enums.UserRole;
import com.httmdt.orientalherbs.model.order.Order;
import com.httmdt.orientalherbs.model.review.ProductReview;
import com.httmdt.orientalherbs.model.enums.AuthProvider;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(nullable = true)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column(nullable = true)
    private String providerId;

    @Column(nullable = true, length = 20)
    private String phoneNumber;

    @Column(nullable = true)
    private LocalDate dateOfBirth;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column
    private PaymentMethod preferredPaymentMethod;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<UserHealthTag> userHealthTags;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<UserAddress> userAddresses;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Cart cart;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Order> orders;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<ProductReview> productReviews;
}