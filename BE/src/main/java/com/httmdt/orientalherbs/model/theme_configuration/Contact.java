package com.httmdt.orientalherbs.model.theme_configuration;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "contacts")
public class Contact {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String phone;

    @Column
    private String email;

    @Column
    private String address;

    @Column
    private String facebook;

    @Column
    private String zalo;

    @Column
    private String instagram; 
}
