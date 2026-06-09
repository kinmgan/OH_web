package com.httmdt.orientalherbs.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "warehouse_config")
@Getter
@Setter
@NoArgsConstructor
public class WarehouseConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "warehouse_name")
    private String warehouseName;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "province_name")
    private String provinceName;

    @Column(name = "district_id")
    private Integer districtId;

    @Column(name = "district_name")
    private String districtName;

    @Column(name = "ward_code")
    private String wardCode;

    @Column(name = "ward_name")
    private String wardName;

    @Column(columnDefinition = "TEXT")
    private String detailedAddress;

    private String phone;

    @Column(name = "is_active")
    private Boolean isActive;
}
