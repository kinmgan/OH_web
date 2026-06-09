package com.httmdt.orientalherbs.dto.contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactMessageRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must not exceed 100 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email is invalid")
        @Size(max = 150, message = "Email must not exceed 150 characters")
        String email,

        @Size(max = 30, message = "Phone must not exceed 30 characters")
        String phone,

        @NotBlank(message = "Subject is required")
        @Size(max = 150, message = "Subject must not exceed 150 characters")
        String subject,

        @NotBlank(message = "Message is required")
        @Size(max = 3000, message = "Message must not exceed 3000 characters")
        String message
) {
}
