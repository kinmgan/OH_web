package com.httmdt.orientalherbs.dao.theme_configuration;

import com.httmdt.orientalherbs.model.theme_configuration.StaticPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaticPageRepository extends JpaRepository<StaticPage, Long> {
    Optional<StaticPage> findBySlug(String slug);
}
