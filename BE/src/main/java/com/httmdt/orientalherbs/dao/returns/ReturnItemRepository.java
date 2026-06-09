package com.httmdt.orientalherbs.dao.returns;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.returns.ReturnItem;

@Repository
public interface ReturnItemRepository extends JpaRepository<ReturnItem, Long> {
}
