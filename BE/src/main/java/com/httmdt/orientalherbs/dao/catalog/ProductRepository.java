package com.httmdt.orientalherbs.dao.catalog;

import java.util.List;

import com.httmdt.orientalherbs.model.catalog.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByOrderBySoldQuantityDesc(Pageable pageable);

    List<Product> findByOrderByAverageRatingDesc(Pageable pageable);

    List<Product> findByOrderByCreatedAtDesc(Pageable pageable);

    Page<Product> findByCategoryIdOrderByIdDesc(Long categoryId, Pageable pageable);

    // Fetch cả images và variants để lấy giá thấp nhất và ảnh mặc định trong 1
    // query [cite: 20, 21]
    // @EntityGraph(attributePaths = {"images", "variants"}) // Removed to prevent
    // MultipleBagFetchException and in-memory pagination
    @Override
    Page<Product> findAll(Pageable pageable);

    // @EntityGraph(attributePaths = {"images", "variants"}) // Removed to prevent
    // MultipleBagFetchException and in-memory pagination
    Page<Product> findByCategory_Id(Long categoryId, Pageable pageable);

    @Query(value = "SELECT p.* FROM products p WHERE " +
                   "(:categoryId IS NULL OR p.category_id = :categoryId) AND " +
                   "(:keyword IS NULL OR " +
                   "p.name ILIKE CONCAT('%', CAST(:keyword AS TEXT), '%') OR " +
                   "CAST(:keyword AS TEXT) ILIKE CONCAT('%', p.name, '%') OR " +
                   "EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE t ILIKE CONCAT('%', CAST(:keyword AS TEXT), '%') OR CAST(:keyword AS TEXT) ILIKE CONCAT('%', t, '%')))",
           countQuery = "SELECT count(*) FROM products p WHERE " +
                        "(:categoryId IS NULL OR p.category_id = :categoryId) AND " +
                        "(:keyword IS NULL OR " +
                        "p.name ILIKE CONCAT('%', CAST(:keyword AS TEXT), '%') OR " +
                        "CAST(:keyword AS TEXT) ILIKE CONCAT('%', p.name, '%') OR " +
                        "EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE t ILIKE CONCAT('%', CAST(:keyword AS TEXT), '%') OR CAST(:keyword AS TEXT) ILIKE CONCAT('%', t, '%')))",
           nativeQuery = true)
    Page<Product> searchProducts(@Param("categoryId") Long categoryId, @Param("keyword") String keyword, Pageable pageable);
}