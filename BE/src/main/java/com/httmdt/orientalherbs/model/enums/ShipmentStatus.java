package com.httmdt.orientalherbs.model.enums;

public enum ShipmentStatus {
    PENDING,      // Chờ xử lý
    CREATED,      // Đã tạo đơn ở carrier
    PICKED_UP,    // Đã lấy hàng
    IN_TRANSIT,   // Đang vận chuyển
    DELIVERED,    // Đã giao
    FAILED,       // Thất bại
    RETURNED      // Hoàn trả
}
