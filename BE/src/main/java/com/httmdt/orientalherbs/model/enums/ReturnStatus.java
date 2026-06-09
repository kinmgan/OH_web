package com.httmdt.orientalherbs.model.enums;

public enum ReturnStatus {
    PENDING,        // Đang chờ xử lý
    APPROVED,       // Đã chấp nhận
    REJECTED,       // Bị từ chối
    RECEIVED,       // Đã nhận lại hàng
    REFUNDED        // Đã hoàn tiền
}