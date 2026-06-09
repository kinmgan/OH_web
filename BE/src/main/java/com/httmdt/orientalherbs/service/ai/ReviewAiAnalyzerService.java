package com.httmdt.orientalherbs.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.Part;
import com.httmdt.orientalherbs.dao.review.ProductReviewRepository;
import com.httmdt.orientalherbs.model.enums.Sentiment;
import com.httmdt.orientalherbs.model.review.ProductReview;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewAiAnalyzerService {

    private final GeminiClientManager geminiClientManager;
    private final ProductReviewRepository productReviewRepository;
    private final ObjectMapper objectMapper;

    @Value("${gemini.model}")
    private String modelName;

    @Value("${gemini.review-ai-enabled:true}")
    private boolean reviewAiEnabled;

    private static final String SYSTEM_INSTRUCTION = """
            Phân tích đoạn review sau và trả về ĐÚNG MỘT JSON với cấu trúc:
            {"sentiment": "POSITIVE"|"NEGATIVE"|"NEUTRAL", "keywords": ["kw1","kw2","kw3","kw4","kw5"]}
            
            Trong đó:
            - sentiment: POSITIVE (tích cực), NEGATIVE (tiêu cực), NEUTRAL (trung lập)
            - keywords: 5 từ khóa nổi bật từ review (tên sản phẩm, tính năng, cảm xúc, v.v.)
            
            Không giải thích gì thêm, chỉ trả về JSON.
            """;

    @Async
    public void analyzeReview(Long reviewId) {
        if (!reviewAiEnabled) {
            log.debug("Review AI analysis is disabled (gemini.review-ai-enabled=false). Skipping review {}", reviewId);
            return;
        }

        if (!geminiClientManager.isEnabled()) {
            log.debug("Gemini AI is disabled globally. Skipping review {}", reviewId);
            return;
        }

        try {
            ProductReview review = productReviewRepository.findById(reviewId).orElse(null);
            if (review == null) {
                log.warn("Review not found: {}", reviewId);
                return;
            }

            if (review.getComment() == null || review.getComment().isBlank()) {
                log.debug("Review {} has no comment, skipping analysis", reviewId);
                return;
            }

            if (review.getSentiment() != null) {
                log.debug("Review {} already analyzed", reviewId);
                return;
            }

            String prompt = "Review: " + review.getComment();
            
            GenerateContentConfig config = GenerateContentConfig.builder()
                .systemInstruction(Content.fromParts(Part.fromText(SYSTEM_INSTRUCTION)))
                .temperature(0.3f)
                .build();

            var response = geminiClientManager.generateContentWithRotation(modelName, prompt, config);
            String responseText = response.text();

            if (responseText != null && !responseText.isBlank()) {
                parseAndSaveResult(review, responseText.trim());
            } else {
                log.warn("Empty response from Gemini for review {}", reviewId);
            }

        } catch (Exception e) {
            log.error("Failed to analyze review {}: {}", reviewId, e.getMessage(), e);
        }
    }

    private void parseAndSaveResult(ProductReview review, String jsonResponse) {
        try {
            String cleanJson = jsonResponse;
            int jsonStart = jsonResponse.indexOf("{");
            int jsonEnd = jsonResponse.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd >= jsonStart) {
                cleanJson = jsonResponse.substring(jsonStart, jsonEnd + 1);
            }

            JsonNode root = objectMapper.readTree(cleanJson);

            String sentimentStr = root.has("sentiment") ? root.get("sentiment").asText() : null;
            Sentiment sentiment = null;
            if (sentimentStr != null) {
                try {
                    sentiment = Sentiment.valueOf(sentimentStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid sentiment value: {}", sentimentStr);
                }
            }

            List<String> keywords = new ArrayList<>();
            if (root.has("keywords") && root.get("keywords").isArray()) {
                for (JsonNode kw : root.get("keywords")) {
                    String keyword = kw.asText().trim();
                    if (!keyword.isBlank() && keywords.size() < 5) {
                        keywords.add(keyword);
                    }
                }
            }

            review.setSentiment(sentiment);
            review.setKeywords(keywords.isEmpty() ? null : keywords);
            productReviewRepository.save(review);

            log.info("Analyzed review {}: sentiment={}, keywords={}", review.getId(), sentiment, keywords);

        } catch (Exception e) {
            log.error("Failed to parse Gemini response for review {}: {}", review.getId(), e.getMessage());
        }
    }
}
