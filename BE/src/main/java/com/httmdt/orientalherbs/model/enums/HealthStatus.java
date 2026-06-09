package com.httmdt.orientalherbs.model.enums;

public enum HealthStatus {
    ACTIVE,     // Đang mắc bệnh / Triệu chứng đang diễn ra
    RESOLVED,   // Đã khỏi bệnh
    CHRONIC,    // Bệnh mãn tính / Kéo dài
    UNKNOWN     // Không rõ (Dành cho trường hợp LLM không xác định được)
}