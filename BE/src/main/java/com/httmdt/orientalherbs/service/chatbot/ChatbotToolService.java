package com.httmdt.orientalherbs.service.chatbot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.httmdt.orientalherbs.dao.user.UserHealthTagRepository;
import com.httmdt.orientalherbs.dao.user.UserRepository;
import com.httmdt.orientalherbs.dto.catalog.ProductDetailResponseDto;
import com.httmdt.orientalherbs.dto.catalog.ProductSummaryDto;
import com.httmdt.orientalherbs.model.enums.HealthCategory;
import com.httmdt.orientalherbs.model.enums.HealthStatus;
import com.httmdt.orientalherbs.model.user.User;
import com.httmdt.orientalherbs.model.user.UserHealthTag;
import com.httmdt.orientalherbs.service.catalog.ProductDetailService;
import com.httmdt.orientalherbs.service.catalog.ProductPublicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotToolService {

    private final ProductPublicService productPublicService;
    private final ProductDetailService productDetailService;
    private final ObjectMapper objectMapper;
    private final UserHealthTagRepository userHealthTagRepository;
    private final UserRepository userRepository;

    private Long currentUserId;

    public void setCurrentUserId(Long userId) {
        this.currentUserId = userId;
    }

    public String executeFunction(String functionName, Object rawArgs) {
        return switch (functionName) {
            case "get_products" -> executeGetProducts(parseKeywordArg(rawArgs));
            case "get_product_detail" -> executeGetProductDetail(parseProductIdArg(rawArgs));
            case "save_user_health_tags" -> executeSaveUserHealthTags(rawArgs);
            default -> "{\"error\": \"Unknown function: " + functionName + "\"}";
        };
    }

    private String parseKeywordArg(Object rawArgs) {
        if (rawArgs == null) return "";
        if (rawArgs instanceof String) return (String) rawArgs;
        if (rawArgs instanceof Map<?, ?> map) {
            Object keyword = map.get("keyword");
            if (keyword != null) return keyword.toString();
        }
        return "";
    }

    private Long parseProductIdArg(Object rawArgs) {
        if (rawArgs == null) return null;
        if (rawArgs instanceof Number) return ((Number) rawArgs).longValue();
        if (rawArgs instanceof String str) {
            try { return Long.parseLong(str); } catch (NumberFormatException e) { return null; }
        }
        if (rawArgs instanceof Map<?, ?> map) {
            Object val = map.get("productId");
            if (val instanceof Number) return ((Number) val).longValue();
            if (val instanceof String str) {
                try { return Long.parseLong(str); } catch (NumberFormatException e) { return null; }
            }
        }
        return null;
    }

    private String executeGetProducts(String keyword) {
        try {
            var result = productPublicService.getProducts(null, keyword, 0, 5, "id", "asc");
            List<ProductSummaryDto> products = result.getContent();

            if (products.isEmpty()) {
                return "{\"products\": [], \"message\": \"Không tìm thấy sản phẩm nào phù hợp.\"}";
            }

            ArrayNode arrayNode = objectMapper.createArrayNode();
            for (ProductSummaryDto p : products) {
                ObjectNode node = objectMapper.createObjectNode();
                node.put("id", p.getId());
                node.put("name", p.getName());
                node.put("price", p.getFinalPrice() != null ? p.getFinalPrice().toString() : "");
                node.put("originalPrice", p.getOriginalPrice() != null ? p.getOriginalPrice().toString() : "");
                node.put("imageUrl", p.getImageUrl() != null ? p.getImageUrl() : "");
                node.put("soldQuantity", p.getSoldQuantity() != null ? p.getSoldQuantity() : 0);
                node.put("rating", p.getRate() != null ? p.getRate() : 0.0);
                node.put("hasDiscount", p.getCampaignId() != null);
                arrayNode.add(node);
            }

            ObjectNode root = objectMapper.createObjectNode();
            root.set("products", arrayNode);
            root.put("total", result.getTotalElements());
            return objectMapper.writeValueAsString(root);

        } catch (Exception e) {
            return "{\"error\": \"Lỗi khi tìm sản phẩm: " + e.getMessage() + "\"}";
        }
    }

    private String executeGetProductDetail(Long productId) {
        if (productId == null) {
            return "{\"error\": \"productId is required\"}";
        }

        try {
            ProductDetailResponseDto product = productDetailService.getProductDetail(productId);

            ObjectNode root = objectMapper.createObjectNode();
            root.put("id", product.getId());
            root.put("name", product.getName());
            root.put("description", product.getDescription() != null ? product.getDescription() : "");
            root.put("origin", product.getOrigin() != null ? product.getOrigin() : "");
            root.put("soldQuantity", product.getSoldQuantity() != null ? product.getSoldQuantity() : 0);
            root.put("averageRating", product.getAverageRating() != null ? product.getAverageRating() : 0.0);
            root.put("categoryName", product.getCategoryName() != null ? product.getCategoryName() : "");

            if (product.getProperties() != null && !product.getProperties().isEmpty()) {
                root.put("properties", product.getProperties().toString());
            }
            if (product.getFlavors() != null && !product.getFlavors().isEmpty()) {
                root.put("flavors", product.getFlavors().toString());
            }
            if (product.getMeridians() != null && !product.getMeridians().isEmpty()) {
                root.put("meridians", product.getMeridians().toString());
            }

            ArrayNode variantsNode = objectMapper.createArrayNode();
            if (product.getVariants() != null) {
                for (ProductDetailResponseDto.ProductVariantDto v : product.getVariants()) {
                    ObjectNode variantNode = objectMapper.createObjectNode();
                    variantNode.put("id", v.getId());
                    variantNode.put("unitName", v.getUnitName() != null ? v.getUnitName() : "");
                    variantNode.put("price", v.getFinalPrice() != null ? v.getFinalPrice().toString() : "");
                    variantNode.put("originalPrice", v.getOriginalPrice() != null ? v.getOriginalPrice().toString() : "");
                    variantNode.put("stockQuantity", v.getStockQuantity() != null ? v.getStockQuantity() : 0);
                    variantNode.put("hasDiscount", v.getCampaignId() != null);
                    variantsNode.add(variantNode);
                }
            }
            root.set("variants", variantsNode);

            ArrayNode imagesNode = objectMapper.createArrayNode();
            if (product.getImages() != null) {
                product.getImages().stream()
                    .filter(img -> img.getProductImageUrl() != null)
                    .limit(3)
                    .forEach(img -> imagesNode.add(img.getProductImageUrl()));
            }
            root.set("imageUrls", imagesNode);

            return objectMapper.writeValueAsString(root);

        } catch (RuntimeException e) {
            return "{\"error\": \"Không tìm thấy sản phẩm với ID: " + productId + "\"}";
        } catch (Exception e) {
            return "{\"error\": \"Lỗi khi lấy chi tiết sản phẩm: " + e.getMessage() + "\"}";
        }
    }

    private String executeSaveUserHealthTags(Object rawArgs) {
        if (currentUserId == null) {
            log.debug("User not logged in, skipping health tag save");
            return "{\"status\": \"skipped\", \"reason\": \"User not logged in\"}";
        }

        Map<?, ?> args = parseArgsAsMap(rawArgs);
        if (args == null) {
            return "{\"status\": \"error\", \"message\": \"Invalid arguments\"}";
        }

        String tagName = getStringValue(args, "tagName");
        String statusStr = getStringValue(args, "status");
        String categoryStr = getStringValue(args, "category");
        String notes = getStringValue(args, "notes");
        Double confidenceScore = getDoubleValue(args, "confidenceScore");

        if (tagName == null || tagName.isBlank() || statusStr == null) {
            return "{\"status\": \"error\", \"message\": \"tagName and status are required\"}";
        }

        HealthStatus status;
        try {
            status = HealthStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            status = HealthStatus.UNKNOWN;
        }

        HealthCategory category = null;
        if (categoryStr != null && !categoryStr.isBlank()) {
            try {
                category = HealthCategory.valueOf(categoryStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                category = HealthCategory.KHAC;
            }
        } else {
            category = HealthCategory.KHAC;
        }

        final String finalTagName = tagName;
        final HealthStatus finalStatus = status;
        final HealthCategory finalCategory = category;
        final String finalNotes = notes;
        final Double finalConfidenceScore = confidenceScore;

        saveHealthTagAsync(currentUserId, finalTagName, finalStatus, finalCategory, finalNotes, finalConfidenceScore);

        return "{\"status\": \"saved\", \"tagName\": \"" + tagName + "\"}";
    }

    @Async
    public void saveHealthTagAsync(Long userId, String tagName, HealthStatus status, HealthCategory category, String notes, Double confidenceScore) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                log.warn("User not found for health tag: userId={}", userId);
                return;
            }

            UserHealthTag tag = new UserHealthTag();
            tag.setTagName(tagName);
            tag.setStatus(status);
            tag.setCategory(category);
            tag.setNotes(notes);
            tag.setConfidenceScore(confidenceScore);
            tag.setUser(user);
            tag.setDetectedAt(java.time.LocalDateTime.now());

            userHealthTagRepository.save(tag);
            log.info("Saved health tag '{}' (category: {}) for user {}", tagName, category, userId);

        } catch (Exception e) {
            log.error("Failed to save health tag for user {}: {}", userId, e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<?, ?> parseArgsAsMap(Object rawArgs) {
        if (rawArgs == null) return null;
        if (rawArgs instanceof Map) return (Map<?, ?>) rawArgs;
        if (rawArgs instanceof String str) {
            try {
                return objectMapper.readValue(str, Map.class);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private String getStringValue(Map<?, ?> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private Double getDoubleValue(Map<?, ?> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).doubleValue();
        try {
            return Double.parseDouble(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
