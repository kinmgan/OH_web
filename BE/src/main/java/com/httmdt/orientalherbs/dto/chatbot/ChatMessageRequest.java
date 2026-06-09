package com.httmdt.orientalherbs.dto.chatbot;

import jakarta.validation.constraints.NotBlank;

public record ChatMessageRequest(
    @NotBlank(message = "Message cannot be empty")
    String message,

    String sessionId
) {}
