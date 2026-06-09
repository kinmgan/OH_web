package com.httmdt.orientalherbs.controller.public_api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.httmdt.orientalherbs.service.shipping.ShippingWebhookService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/webhooks")
@RequiredArgsConstructor
@Slf4j
public class ShippingWebhookController {

    private final ShippingWebhookService webhookService;

    /**
     * Webhook endpoint for GHN (Giao Hàng Nhanh)
     */
    @PostMapping("/ghn")
    public ResponseEntity<String> handleGhnWebhook(@RequestBody String payload) {
        log.info("Received GHN webhook: {}", payload);
        try {
            webhookService.processGhnWebhook(payload);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing GHN webhook: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Webhook endpoint for GHTK (Giao Hàng Tiết Kiệm)
     */
    @PostMapping("/ghtk")
    public ResponseEntity<String> handleGhtkWebhook(@RequestBody String payload) {
        log.info("Received GHTK webhook: {}", payload);
        try {
            webhookService.processGhtkWebhook(payload);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing GHTK webhook: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Webhook endpoint for VNPOST
     */
    @PostMapping("/vnpost")
    public ResponseEntity<String> handleVnpostWebhook(@RequestBody String payload) {
        log.info("Received VNPOST webhook: {}", payload);
        try {
            webhookService.processVnpostWebhook(payload);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error processing VNPOST webhook: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
