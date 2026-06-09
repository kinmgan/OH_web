package com.httmdt.orientalherbs.dao.theme_configuration;

import com.httmdt.orientalherbs.model.theme_configuration.SiteConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SiteConfigRepository extends JpaRepository<SiteConfig, String> {
    Optional<SiteConfig> findByConfigKey(String configKey);
}
