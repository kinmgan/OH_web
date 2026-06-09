package com.httmdt.orientalherbs.model.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "user_addresses")
public class UserAddress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String receiverName;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "province_name", nullable = false)
    private String provinceName;

    @Column(name = "district_id")
    private Integer districtId;

    @Column(name = "district_name", nullable = false)
    private String districtName;

    @Column(name = "ward_code")
    private String wardCode;

    @Column(name = "ward_name", nullable = false)
    private String wardName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String detailedAddress;

    private Boolean isDefault;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
