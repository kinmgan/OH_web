package com.httmdt.orientalherbs.model.theme_configuration;

import java.time.LocalDateTime;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "theme_config")
public class ThemeConfig {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "theme_name")
    private String themeName;

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @Column(name = "header_image_1_url")
    private String headerImage1Url;

    @Column(name = "header_image_2_url")
    private String headerImage2Url;

    @Column(name = "header_image_3_url")
    private String headerImage3Url;

    @Column(name = "header_video_url")
    private String headerVideoUrl;

    @Column(name = "promotion_image_url")
    private String promotionImageUrl;

    @Column(name = "promotion_image_link")
    private String promotionImageLink;

    @Column(name = "is_active")
    private Boolean isActive;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}