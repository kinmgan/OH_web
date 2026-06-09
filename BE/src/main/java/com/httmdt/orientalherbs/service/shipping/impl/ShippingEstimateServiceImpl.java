package com.httmdt.orientalherbs.service.shipping.impl;

import com.httmdt.orientalherbs.dao.WarehouseConfigRepository;
import com.httmdt.orientalherbs.dao.catalog.ProductVariantRepository;
import com.httmdt.orientalherbs.dao.user.UserAddressRepository;
import com.httmdt.orientalherbs.dto.shipping.ShippingFeeRequest;
import com.httmdt.orientalherbs.dto.shipping.ShippingFeeResponse;
import com.httmdt.orientalherbs.model.WarehouseConfig;
import com.httmdt.orientalherbs.model.catalog.ProductVariant;
import com.httmdt.orientalherbs.model.user.UserAddress;
import com.httmdt.orientalherbs.service.shipping.ShippingEstimateService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShippingEstimateServiceImpl implements ShippingEstimateService {

    private final UserAddressRepository userAddressRepository;
    private final ProductVariantRepository productVariantRepository;
    private final WarehouseConfigRepository warehouseConfigRepository;

    @Value("${GHN_TOKEN:}")
    private String ghnToken;

    @Value("${GHN_SHOP_ID:}")
    private String ghnShopId;
    
    @Value("${GHTK_TOKEN:}")
    private String ghtkToken;

    @Value("${VNPOST_TOKEN:}")
    private String vnpostToken;

    private static final String GHN_BASE_URL = "https://dev-online-gateway.ghn.vn/shiip/public-api";
    private static final String GHTK_BASE_URL = "https://services.giaohangtietkiem.vn";
    private static final int GHN_SERVICE_ID = 53321; // Giao hàng tiết kiệm

    @Override
    public List<ShippingFeeResponse> estimateShipping(Long addressId, List<ShippingFeeRequest.CartItemRequest> items) {
        List<ShippingFeeResponse> estimates = new ArrayList<>();

        UserAddress address = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        WarehouseConfig warehouse = warehouseConfigRepository.findByIsActiveTrue()
                .orElseThrow(() -> new RuntimeException("No active warehouse configured"));

        Map<Long, ProductVariant> variantMap = productVariantRepository.findAllById(
                items.stream().map(ShippingFeeRequest.CartItemRequest::getProductVariantId).collect(Collectors.toList())
        ).stream().collect(Collectors.toMap(ProductVariant::getProductVariantId, v -> v));

        int totalWeight = 0;
        int totalLength = 0;
        int totalWidth = 0;
        int totalHeight = 0;

        for (ShippingFeeRequest.CartItemRequest cartItem : items) {
            ProductVariant variant = variantMap.get(cartItem.getProductVariantId());
            if (variant != null) {
                int qty = cartItem.getQuantity() != null ? cartItem.getQuantity() : 1;
                totalWeight += (variant.getWeightGram() != null ? variant.getWeightGram() : 200) * qty;
                totalLength += (variant.getLengthCm() != null ? variant.getLengthCm() : 20) * qty;
                totalWidth += (variant.getWidthCm() != null ? variant.getWidthCm() : 15) * qty;
                totalHeight += (variant.getHeightCm() != null ? variant.getHeightCm() : 10) * qty;
            }
        }

        if (totalWeight == 0) totalWeight = 500;
        if (totalLength == 0) totalLength = 20;
        if (totalWidth == 0) totalWidth = 15;
        if (totalHeight == 0) totalHeight = 10;

        // GHN Estimate
        ShippingFeeResponse ghnEstimate = calculateGhnFee(address, warehouse, totalWeight, totalLength, totalWidth, totalHeight);
        if (ghnEstimate != null) {
            estimates.add(ghnEstimate);
        }

        // GHTK Estimate (mock)
        ShippingFeeResponse ghtkEstimate = calculateGhtkFee(address, warehouse, totalWeight);
        estimates.add(ghtkEstimate);

        // VNPost Estimate (mock)
        ShippingFeeResponse vnpostEstimate = calculateVnpostFee(address, warehouse, totalWeight);
        estimates.add(vnpostEstimate);

        return estimates;
    }

    private ShippingFeeResponse calculateGhnFee(UserAddress address, WarehouseConfig warehouse,
                                                int weight, int length, int width, int height) {
        try {
            if (ghnToken == null || ghnToken.isEmpty()) {
                System.out.println("[GHN] No token configured, using mock response");
                return createMockGhnResponse(address, warehouse, weight);
            }

            String jsonPayload = String.format("""
                {
                    "from_district_id": %d,
                    "to_district_id": %d,
                    "to_ward_code": "%s",
                    "weight": %d,
                    "length": %d,
                    "width": %d,
                    "height": %d,
                    "service_type_id": 2
                }
                """,
                    warehouse.getDistrictId() != null ? warehouse.getDistrictId() : 0,
                    address.getDistrictId() != null ? address.getDistrictId() : 0,
                    address.getWardCode() != null ? address.getWardCode() : "",
                    weight, length, width, height);

            System.out.println("[GHN] Request payload: " + jsonPayload);
            System.out.println("[GHN] Token: " + ghnToken.substring(0, Math.min(8, ghnToken.length())) + "...");
            System.out.println("[GHN] ShopId: " + ghnShopId);

            java.net.HttpURLConnection conn = (java.net.HttpURLConnection)
                    new java.net.URL(GHN_BASE_URL + "/v2/shipping-order/fee").openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Token", ghnToken);
            conn.setRequestProperty("ShopId", ghnShopId != null ? ghnShopId : "0");
            conn.setDoOutput(true);

            try (var os = conn.getOutputStream()) {
                os.write(jsonPayload.getBytes());
            }

            int responseCode = conn.getResponseCode();
            System.out.println("[GHN] Response code: " + responseCode);

            if (responseCode == 200) {
                try (var reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(conn.getInputStream()))) {
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }

                    System.out.println("[GHN] Response: " + response.toString());

                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    var node = mapper.readTree(response.toString());

                    if (node.has("data")) {
                        var data = node.get("data");
                        BigDecimal fee = new BigDecimal(data.has("total") ? data.get("total").asText() : "30000");
                        int leadtime = data.has("expected_delivery_time") 
                                ? (int) java.time.Duration.between(
                                    java.time.Instant.now(),
                                    java.time.Instant.parse(data.get("expected_delivery_time").asText())
                                  ).toDays() + 1
                                : 3;
                        if (leadtime <= 0) leadtime = 1;

                        return new ShippingFeeResponse("GHN", "Giao Hàng Nhanh", fee, leadtime, "Giao tiết kiệm");
                    }
                }
            } else {
                // Đọc error stream để biết GHN trả lỗi gì
                try (var errorReader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(conn.getErrorStream()))) {
                    StringBuilder errorResponse = new StringBuilder();
                    String line;
                    while ((line = errorReader.readLine()) != null) {
                        errorResponse.append(line);
                    }
                    System.err.println("[GHN] API Error (" + responseCode + "): " + errorResponse.toString());
                }
            }
        } catch (Exception e) {
            System.err.println("[GHN] API call failed: " + e.getMessage());
            e.printStackTrace();
        }
        return createMockGhnResponse(address, warehouse, weight);
    }

    private ShippingFeeResponse createMockGhnResponse(UserAddress address, WarehouseConfig warehouse, int weight) {
        boolean isLocal = java.util.Objects.equals(address.getProvinceId(), warehouse.getProvinceId());
        BigDecimal baseFee = isLocal ? new BigDecimal("15000") : new BigDecimal("30000");
        BigDecimal weightFee = new BigDecimal(weight).divide(new BigDecimal("1000"), 0, java.math.RoundingMode.CEILING)
                .multiply(new BigDecimal("3000"));
        BigDecimal totalFee = baseFee.add(weightFee).min(new BigDecimal("80000"));
        int leadtime = isLocal ? 1 : 3;

        return new ShippingFeeResponse("GHN", "Giao Hàng Nhanh", totalFee, leadtime, "Giao tiết kiệm");
    }

    private ShippingFeeResponse calculateGhtkFee(UserAddress address, WarehouseConfig warehouse, int weight) {
        try {
            if (ghtkToken == null || ghtkToken.isEmpty() || ghtkToken.equals("your_ghtk_token_here")) {
                System.out.println("[GHTK] No token configured, using mock response");
                return createMockGhtkResponse(address, warehouse, weight);
            }

            // GHTK Fee API uses query parameters for GET request
            String pickProvince = java.net.URLEncoder.encode(warehouse.getProvinceName() != null ? warehouse.getProvinceName() : "", "UTF-8");
            String pickDistrict = java.net.URLEncoder.encode(warehouse.getDistrictName() != null ? warehouse.getDistrictName() : "", "UTF-8");
            String deliverProvince = java.net.URLEncoder.encode(address.getProvinceName() != null ? address.getProvinceName() : "", "UTF-8");
            String deliverDistrict = java.net.URLEncoder.encode(address.getDistrictName() != null ? address.getDistrictName() : "", "UTF-8");

            String urlString = String.format("%s/services/shipment/fee?pick_province=%s&pick_district=%s&province=%s&district=%s&weight=%d",
                    GHTK_BASE_URL, pickProvince, pickDistrict, deliverProvince, deliverDistrict, weight);

            System.out.println("[GHTK] Request URL: " + urlString);

            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) new java.net.URL(urlString).openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Token", ghtkToken);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                try (var reader = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream()))) {
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) response.append(line);
                    
                    System.out.println("[GHTK] Response: " + response.toString());
                    
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    var node = mapper.readTree(response.toString());

                    if (node.has("success") && node.get("success").asBoolean() && node.has("fee")) {
                        var feeNode = node.get("fee");
                        BigDecimal fee = new BigDecimal(feeNode.has("fee") ? feeNode.get("fee").asText() : "32000");
                        return new ShippingFeeResponse("GHTK", "Giao Hàng Tiết Kiệm", fee, 3, "Tiêu chuẩn");
                    }
                }
            } else {
                System.err.println("[GHTK] API Error Code: " + responseCode);
            }
        } catch (Exception e) {
            System.err.println("[GHTK] API call failed: " + e.getMessage());
        }
        return createMockGhtkResponse(address, warehouse, weight);
    }

    private ShippingFeeResponse createMockGhtkResponse(UserAddress address, WarehouseConfig warehouse, int weight) {
        boolean isLocal = java.util.Objects.equals(address.getProvinceId(), warehouse.getProvinceId());
        BigDecimal baseFee = isLocal ? new BigDecimal("16000") : new BigDecimal("32000");
        BigDecimal weightFee = new BigDecimal(weight).divide(new BigDecimal("1000"), 0, java.math.RoundingMode.CEILING).multiply(new BigDecimal("2500"));
        BigDecimal totalFee = baseFee.add(weightFee).min(new BigDecimal("70000"));
        int estimatedDays = isLocal ? 2 : 4;
        return new ShippingFeeResponse("GHTK", "Giao Hàng Tiết Kiệm", totalFee, estimatedDays, "Tiêu chuẩn");
    }

    private ShippingFeeResponse calculateVnpostFee(UserAddress address, WarehouseConfig warehouse, int weight) {
        try {
            if (vnpostToken == null || vnpostToken.isEmpty() || vnpostToken.equals("your_vnpost_token_here")) {
                System.out.println("[VNPOST] No token configured, using mock response");
                return createMockVnpostResponse(address, warehouse, weight);
            }

            // VNPOST Fee API implementation (using standard JSON POST structure based on VNPost V2)
            String vnpostUrl = "https://api.vnpost.vn/api/v2/fee"; // Endpoint ví dụ, tuỳ theo tài liệu thực tế của VNPOST
            String jsonPayload = String.format("""
                {
                    "SenderProvinceId": "%d",
                    "SenderDistrictId": "%d",
                    "ReceiverProvinceId": "%d",
                    "ReceiverDistrictId": "%d",
                    "Weight": %d,
                    "ServiceCode": "EMS"
                }
                """,
                    warehouse.getProvinceId() != null ? warehouse.getProvinceId() : 0,
                    warehouse.getDistrictId() != null ? warehouse.getDistrictId() : 0,
                    address.getProvinceId() != null ? address.getProvinceId() : 0,
                    address.getDistrictId() != null ? address.getDistrictId() : 0,
                    weight);

            System.out.println("[VNPOST] Request payload: " + jsonPayload);

            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) new java.net.URL(vnpostUrl).openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Token", vnpostToken); // VNPost có thể yêu cầu Bearer Authorization thay vì Token header
            conn.setDoOutput(true);

            try (var os = conn.getOutputStream()) {
                os.write(jsonPayload.getBytes());
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                try (var reader = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream()))) {
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) response.append(line);
                    
                    System.out.println("[VNPOST] Response: " + response.toString());
                    
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    var node = mapper.readTree(response.toString());

                    if (node.has("Data") && node.get("Data").has("TotalFee")) {
                        BigDecimal fee = new BigDecimal(node.get("Data").get("TotalFee").asText());
                        return new ShippingFeeResponse("VNPOST", "Vietnam Post", fee, 4, "Bưu điện");
                    }
                }
            } else {
                System.err.println("[VNPOST] API Error Code: " + responseCode);
            }
        } catch (Exception e) {
            System.err.println("[VNPOST] API call failed: " + e.getMessage());
        }
        return createMockVnpostResponse(address, warehouse, weight);
    }

    private ShippingFeeResponse createMockVnpostResponse(UserAddress address, WarehouseConfig warehouse, int weight) {
        boolean isLocal = java.util.Objects.equals(address.getProvinceId(), warehouse.getProvinceId());
        BigDecimal baseFee = isLocal ? new BigDecimal("14000") : new BigDecimal("28000");
        BigDecimal weightFee = new BigDecimal(weight).divide(new BigDecimal("1000"), 0, java.math.RoundingMode.CEILING).multiply(new BigDecimal("2000"));
        BigDecimal totalFee = baseFee.add(weightFee).min(new BigDecimal("60000"));
        int estimatedDays = isLocal ? 2 : 5;
        return new ShippingFeeResponse("VNPOST", "Vietnam Post", totalFee, estimatedDays, "Bưu điện");
    }
}
