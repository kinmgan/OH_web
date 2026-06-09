package com.httmdt.orientalherbs.model.enums;

public enum HealthCategory {
    HO_HAP("Hệ Hô hấp"),
    TIEU_HOA("Hệ Tiêu hóa"),
    THAN_KINH("Hệ Thần kinh"),
    CO_XUONG_KHOP("Hệ Cơ xương khớp"),
    TIM_MACH("Hệ Tim mạch"),
    DA_LIEU("Hệ Da liễu"),
    KHAC("Khác");

    private final String displayName;

    HealthCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
