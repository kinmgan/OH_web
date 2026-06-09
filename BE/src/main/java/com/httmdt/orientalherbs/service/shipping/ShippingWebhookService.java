package com.httmdt.orientalherbs.service.shipping;

public interface ShippingWebhookService {
    void processGhnWebhook(String payload);
    void processGhtkWebhook(String payload);
    void processVnpostWebhook(String payload);
}
