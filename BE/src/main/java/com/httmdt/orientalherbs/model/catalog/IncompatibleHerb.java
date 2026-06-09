package com.httmdt.orientalherbs.model.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor

@Table(name = "incompatible_herbs")
@Entity
public class IncompatibleHerb {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id_1")
    private Product product1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id_2")
    private Product product2;

    @Column (nullable = false)
    private String warningMessage;
}
