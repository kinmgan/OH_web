package com.httmdt.orientalherbs.dao.catalog;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.catalog.HomepageSection;

@Repository
public interface HomepageSectionRepository extends JpaRepository<HomepageSection, Long> {

    List<HomepageSection> findAllByIsActiveTrueOrderBySortOrderAsc();
}
