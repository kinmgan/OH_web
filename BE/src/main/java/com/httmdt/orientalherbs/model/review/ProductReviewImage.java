package com.httmdt.orientalherbs.model.review;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "product_review_images")
@Getter
@Setter
@NoArgsConstructor
public class ProductReviewImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "image_public_id", length = 255)
    private String imagePublicId;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private ProductReview review;

    public ProductReviewImage(String imageUrl, String imagePublicId, Integer displayOrder) {
        this.imageUrl = imageUrl;
        this.imagePublicId = imagePublicId;
        this.displayOrder = displayOrder;
    }
}
