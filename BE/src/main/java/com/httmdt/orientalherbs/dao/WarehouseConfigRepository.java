package com.httmdt.orientalherbs.dao;

import com.httmdt.orientalherbs.model.WarehouseConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WarehouseConfigRepository extends JpaRepository<WarehouseConfig, Long> {
    Optional<WarehouseConfig> findByIsActiveTrue();
}
