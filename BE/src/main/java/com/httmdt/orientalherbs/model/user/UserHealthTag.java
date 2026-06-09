package com.httmdt.orientalherbs.model.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import com.httmdt.orientalherbs.model.enums.HealthCategory;
import com.httmdt.orientalherbs.model.enums.HealthStatus;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "user_health_tags")
public class UserHealthTag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tag_name", nullable = false)
    private String tagName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private HealthStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 50)
    private HealthCategory category;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes; 

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt; 

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @PrePersist
    protected void onCreate() {
        detectedAt = LocalDateTime.now();
    }
}