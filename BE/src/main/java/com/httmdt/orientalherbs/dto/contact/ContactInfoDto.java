package com.httmdt.orientalherbs.dto.contact;

public record ContactInfoDto(
        Long id,
        String phone,
        String email,
        String address,
        String facebook,
        String zalo,
        String instagram
) {
}
