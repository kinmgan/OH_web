package com.httmdt.orientalherbs.service.ai;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class GeminiClientManager {

    @Value("${gemini.api-keys:${gemini.api-key:}}")
    private String apiKeysString;

    @Value("${gemini.enabled:true}")
    private boolean geminiEnabled;

    @Value("${gemini.rate-limit-per-minute:60}")
    private int rateLimitPerMinute;

    private final List<Client> clients = new ArrayList<>();
    private final AtomicInteger currentIndex = new AtomicInteger(0);
    private final AtomicInteger requestCount = new AtomicInteger(0);
    private volatile long windowStart = System.currentTimeMillis();

    private static final long WINDOW_MS = 60_000;
    private static final long BASE_DELAY_MS = 5_000;

    @PostConstruct
    public void init() {
        if (!geminiEnabled) {
            log.warn("=== Gemini AI is DISABLED via gemini.enabled=false. All AI features will be skipped. ===");
            return;
        }
        if (apiKeysString == null || apiKeysString.isBlank()) {
            throw new IllegalArgumentException("No Gemini API keys found. Please set gemini.api-keys in application.properties.");
        }
        String[] keys = apiKeysString.split(",");
        for (String key : keys) {
            String trimmedKey = key.trim();
            if (!trimmedKey.isEmpty()) {
                clients.add(Client.builder().apiKey(trimmedKey).build());
            }
        }
        if (clients.isEmpty()) {
            throw new IllegalArgumentException("No valid Gemini API keys parsed.");
        }
        log.info("Initialized GeminiClientManager with {} API keys, rate-limit={}/min", clients.size(), rateLimitPerMinute);
    }

    public boolean isEnabled() {
        return geminiEnabled;
    }

    public Client getCurrentClient() {
        return clients.get(currentIndex.get() % clients.size());
    }

    public void rotateClient() {
        int newIndex = currentIndex.incrementAndGet();
        log.info("Rotated to Gemini API key index {}", newIndex % clients.size());
    }

    private void acquireRateLimit() throws RateLimitException {
        long now = System.currentTimeMillis();
        if (now - windowStart >= WINDOW_MS) {
            windowStart = now;
            requestCount.set(0);
        }

        int current = requestCount.get();
        while (current >= rateLimitPerMinute) {
            if (requestCount.get() == 0) break;
            long waitMs = WINDOW_MS - (now - windowStart);
            if (waitMs > 0) {
                log.warn("Rate limit reached ({} req/min). Waiting {}ms before next request.", rateLimitPerMinute, waitMs);
                try {
                    Thread.sleep(Math.min(waitMs, 5_000));
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RateLimitException("Interrupted while waiting for rate limit", e);
                }
                now = System.currentTimeMillis();
                if (now - windowStart >= WINDOW_MS) {
                    windowStart = now;
                    requestCount.set(0);
                    break;
                }
            }
            current = requestCount.get();
        }
        requestCount.incrementAndGet();
    }

    private boolean isQuotaError(Exception e) {
        String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        return msg.contains("quota") || msg.contains("429")
            || msg.contains("exhausted") || msg.contains("resource_exhausted")
            || msg.contains("rate limit");
    }

    private long extractRetryDelayMs(Exception e) {
        String msg = e.getMessage() != null ? e.getMessage() : "";
        Matcher m = Pattern.compile("\"retryDelay\"\\s*:\\s*\"([\\d.]+)s\"").matcher(msg);
        if (m.find()) {
            try {
                return (long) (Double.parseDouble(m.group(1)) * 1000);
            } catch (NumberFormatException ignored) { }
        }
        Matcher m2 = Pattern.compile("(\\d+)s").matcher(msg);
        if (m2.find()) {
            try {
                return Long.parseLong(m2.group(1)) * 1000;
            } catch (NumberFormatException ignored) { }
        }
        return BASE_DELAY_MS;
    }

    @SuppressWarnings("unchecked")
    public GenerateContentResponse generateContentWithRotation(String modelName, Object input, GenerateContentConfig config) throws Exception {
        if (!geminiEnabled) {
            throw new RuntimeException("Gemini AI is disabled. Set gemini.enabled=true to enable.");
        }

        Exception lastException = null;
        int maxAttempts = clients.size() * 2;

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                acquireRateLimit();
            } catch (RateLimitException e) {
                throw new RuntimeException("Rate limit exceeded, cannot proceed: " + e.getMessage(), e);
            }

            Client client = getCurrentClient();
            try {
                if (input instanceof String text) {
                    return client.models.generateContent(modelName, text, config);
                } else if (input instanceof List contents) {
                    return client.models.generateContent(modelName, (List<Content>) contents, config);
                } else {
                    throw new IllegalArgumentException("Unsupported input type");
                }
            } catch (Exception e) {
                lastException = e;
                if (isQuotaError(e)) {
                    log.warn("Gemini quota exceeded on key index {}. Rotating...", currentIndex.get() % clients.size());
                    rotateClient();

                    if (attempt > 0 && attempt % clients.size() == 0) {
                        long delayMs = extractRetryDelayMs(e);
                        long actualDelay = Math.min(delayMs, BASE_DELAY_MS);
                        log.warn("All keys exhausted in this cycle. Sleeping for {}ms before retrying...", actualDelay);
                        try {
                            Thread.sleep(actualDelay);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new RuntimeException("Interrupted while waiting to retry", ie);
                        }
                    }
                } else {
                    throw e;
                }
            }
        }
        throw new RuntimeException("All Gemini API keys exhausted or failed.", lastException);
    }

    public int getCurrentRateLimitUsage() {
        long now = System.currentTimeMillis();
        if (now - windowStart >= WINDOW_MS) return 0;
        return requestCount.get();
    }

    public int getRateLimitPerMinute() {
        return rateLimitPerMinute;
    }

    public static class RateLimitException extends Exception {
        public RateLimitException(String msg, Throwable cause) {
            super(msg, cause);
        }
    }
}
