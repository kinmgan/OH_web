package com.httmdt.orientalherbs.dao.order;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.httmdt.orientalherbs.model.order.Shipment;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    @Query("SELECT s FROM Shipment s WHERE s.order.order_id = :orderId")
    Optional<Shipment> findByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT s FROM Shipment s WHERE s.carrierOrderId = :carrierOrderId")
    Optional<Shipment> findByCarrierOrderId(@Param("carrierOrderId") String carrierOrderId);

    @Query("SELECT s FROM Shipment s WHERE s.trackingNumber = :trackingNumber")
    Optional<Shipment> findByTrackingNumber(@Param("trackingNumber") String trackingNumber);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Shipment s WHERE s.order.order_id = :orderId")
    boolean existsByOrderId(@Param("orderId") Long orderId);
}
