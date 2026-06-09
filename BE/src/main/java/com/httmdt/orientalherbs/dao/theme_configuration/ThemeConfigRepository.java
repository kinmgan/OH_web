package com.httmdt.orientalherbs.dao.theme_configuration;

import com.httmdt.orientalherbs.model.theme_configuration.ThemeConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ThemeConfigRepository extends JpaRepository<ThemeConfig, Long> {
    Optional<ThemeConfig> findByIsActiveTrue();
}
