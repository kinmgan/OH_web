package com.httmdt.orientalherbs.dao.catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.catalog.ProductVariant;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    // Optional<ProductVariant> findByProduct_ProductIdAndUnit_Name(Long productId,
    // String unitName);
}
