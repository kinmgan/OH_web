package com.httmdt.orientalherbs.dao.catalog;

import com.httmdt.orientalherbs.model.catalog.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long id);
    java.util.List<Category> findAllByOrderByDisplayOrderAsc();
}
