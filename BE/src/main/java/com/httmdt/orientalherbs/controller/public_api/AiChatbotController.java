package com.httmdt.orientalherbs.controller.public_api;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import com.httmdt.orientalherbs.security.jwt.JwtUtils;
import com.httmdt.orientalherbs.security.user.CustomUserDetails;
import com.httmdt.orientalherbs.security.user.CustomUserDetailsService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;

@Slf4j
@RestController
@RequestMapping("/public/chatbot")
public class AiChatbotController {

    private final WebClient webClient;
    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;
    private final String internalToken;

    public AiChatbotController(
            WebClient.Builder webClientBuilder,
            JwtUtils jwtUtils,
            CustomUserDetailsService userDetailsService,
            @Value("") String aiServiceUrl,
            @Value("") String internalToken) {

        this.webClient = webClientBuilder.baseUrl(aiServiceUrl).build();
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
        this.internalToken = internalToken;
    }

    @PostMapping(value = "/ai-message", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public org.springframework.web.context.request.async.DeferredResult<String> streamAiMessage(
            HttpServletRequest httpRequest,
            @RequestBody Map<String, Object> body) {

        Long userId = extractUserIdFromRequest(httpRequest);

        Map<String, Object> aiBody = new java.util.HashMap<>();
        aiBody.put("session_id", body.getOrDefault("sessionId", "default-session"));
        aiBody.put("message", body.getOrDefault("message", ""));
        aiBody.put("user_id", userId);
        aiBody.put("stream", true);

        org.springframework.web.context.request.async.DeferredResult<String> deferredResult =
                new org.springframework.web.context.request.async.DeferredResult<>(60000L);

        StringBuilder fullResponse = new StringBuilder();

        webClient.post()
                .uri("/chat/stream")
                .header("X-Internal-Token", internalToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(aiBody)
                .retrieve()
                .bodyToFlux(String.class)
                .doOnNext(chunk -> fullResponse.append(chunk))
                .doOnError(e -> {
                    log.error("Loi khi goi AI Service: {}", e.getMessage());
                    deferredResult.setErrorResult("AI Service phan hoi qua cham, vui long thu lai.");
                })
                .doOnComplete(() -> deferredResult.setResult(fullResponse.toString()))
                .subscribe();

        return deferredResult;
    }

    @DeleteMapping("/session")
    public ResponseEntity<Map<String, Object>> clearSession(
            HttpServletRequest httpRequest,
            @RequestParam String sessionId) {

        try {
            webClient.delete()
                    .uri("/internal/session/" + sessionId)
                    .header("X-Internal-Token", internalToken)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            return ResponseEntity.ok(Map.of("ok", true, "sessionId", sessionId));
        } catch (Exception e) {
            log.warn("Loi khi xoa session AI: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("ok", false, "sessionId", sessionId, "error", e.getMessage()));
        }
    }

    private Long extractUserIdFromRequest(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String jwt = authHeader.substring(7);
                if (jwtUtils.validateJwtToken(jwt)) {
                    String email = jwtUtils.getUserNameFromJwtToken(jwt);
                    CustomUserDetails userDetails =
                            (CustomUserDetails) userDetailsService.loadUserByUsername(email);
                    return userDetails.getId();
                }
            }
        } catch (Exception e) {
            log.debug("Khong the extract userId tu request: {}", e.getMessage());
        }
        return null;
    }
}