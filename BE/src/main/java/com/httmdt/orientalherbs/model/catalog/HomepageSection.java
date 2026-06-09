package com.httmdt.orientalherbs.model.catalog;

import com.httmdt.orientalherbs.model.enums.HomepageSectionType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "homepage_sections")
@Getter
@Setter
@NoArgsConstructor
public class HomepageSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HomepageSectionType type;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "limit_items", nullable = false)
    private Integer limitItems = 10;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
