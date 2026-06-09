package com.httmdt.orientalherbs.dto.contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record ContactInfoRequest(
        @Size(max = 255, message = "Phone must not exceed 255 characters")
        String phone,

        @Email(message = "Email is invalid")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        String email,

        @Size(max = 500, message = "Address must not exceed 500 characters")
        String address,

        @Size(max = 255, message = "Facebook link must not exceed 255 characters")
        String facebook,

        @Size(max = 255, message = "Zalo link must not exceed 255 characters")
        String zalo,

        @Size(max = 255, message = "Instagram link must not exceed 255 characters")
        String instagram
) {
}
