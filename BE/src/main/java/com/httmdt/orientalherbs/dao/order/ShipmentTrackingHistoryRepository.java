package com.httmdt.orientalherbs.dao.order;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.order.ShipmentTrackingHistory;

@Repository
public interface ShipmentTrackingHistoryRepository extends JpaRepository<ShipmentTrackingHistory, Long> {
    
    @Query("SELECT h FROM ShipmentTrackingHistory h WHERE h.shipment.id = :shipmentId ORDER BY h.updatedAt DESC")
    List<ShipmentTrackingHistory> findByShipmentIdOrderByUpdatedAtDesc(@Param("shipmentId") Long shipmentId);
}
