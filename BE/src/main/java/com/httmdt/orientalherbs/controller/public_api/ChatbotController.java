package com.httmdt.orientalherbs.controller.public_api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.httmdt.orientalherbs.dao.user.UserRepository;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.security.jwt.JwtUtils;
import com.httmdt.orientalherbs.service.chatbot.ChatbotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/public/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final ObjectMapper objectMapper;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @PostMapping(value = "/message", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public String sendMessage(HttpServletRequest request) {
        String body;
        try {
            body = new BufferedReader(new InputStreamReader(request.getInputStream(), StandardCharsets.UTF_8))
                .lines()
                .collect(Collectors.joining());
        } catch (Exception e) {
            log.error("Failed to read request body", e);
            return "data: {\"error\":\"Failed to read request body\"}\n\n";
        }

        String message;
        String sessionId;

        try {
            Map<String, Object> parsed = objectMapper.readValue(body, Map.class);
            message = (String) parsed.get("message");
            sessionId = (String) parsed.get("sessionId");
        } catch (Exception e) {
            log.error("Failed to parse request body: {}", body, e);
            return "data: {\"error\":\"Invalid request body\"}\n\n";
        }

        if (message == null || message.isBlank()) {
            return "data: {\"error\":\"Message is required\"}\n\n";
        }

        String effectiveSessionId = (sessionId != null && !sessionId.isBlank())
            ? sessionId
            : UUID.randomUUID().toString();

        Long userId = extractUserIdFromRequest(request);

        try {
            StringBuilder response = new StringBuilder();
            StringBuilder buffer = new StringBuilder();

            chatbotService.chatSync(effectiveSessionId, message, buffer, userId);

            String fullText = buffer.toString();
            if (!fullText.isEmpty()) {
                response.append("data: ")
                    .append(objectMapper.writeValueAsString(Map.of("text", fullText)))
                    .append("\n\n");
            }
            response.append("data: ")
                .append(objectMapper.writeValueAsString(Map.of("done", true)))
                .append("\n\n");

            return response.toString();

        } catch (Exception e) {
            log.error("Error processing chatbot request", e);
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (isQuotaError(msg)) {
                return "data: " + jsonSafe(Map.of("error", "Gemini đang bận (quota đã hết). Vui lòng thử lại sau 1-2 phút. Cảm ơn bạn đã kiên nhẫn! 🙏")) + "\n\n";
            }
            return "data: " + jsonSafe(Map.of("error", "Đã xảy ra lỗi phía server. Vui lòng thử lại sau.")) + "\n\n";
        }
    }

    private Long extractUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authHeader.substring(7);
        if (!jwtUtils.validateJwtToken(token)) {
            return null;
        }

        String email = jwtUtils.getUserNameFromJwtToken(token);
        return userRepository.findByEmail(email)
            .map(User::getUserId)
            .orElse(null);
    }

    private String jsonSafe(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (Exception e) {
            return "{\"error\":\"Server error\"}";
        }
    }

    private boolean isQuotaError(String msg) {
        String lower = msg.toLowerCase();
        return lower.contains("quota") || lower.contains("429")
            || lower.contains("rate limit") || lower.contains("exhausted");
    }

    @DeleteMapping("/session/{sessionId}")
    public Map<String, String> clearSession(@PathVariable String sessionId) {
        chatbotService.clearSession(sessionId);
        return Map.of("message", "Session cleared");
    }
}
