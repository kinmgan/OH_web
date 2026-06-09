package com.httmdt.orientalherbs.dto.returns;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.httmdt.orientalherbs.model.enums.ReturnReason;
import com.httmdt.orientalherbs.model.enums.ReturnStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReturnResponseDTO {
    private Long returnRequestId;
    private Long orderId;
    private String orderCode;
    private ReturnReason reason;
    private String description;
    private List<String> evidenceImages;
    private ReturnStatus status;
    private LocalDateTime createdAt;
    private List<ReturnItemResponseDTO> items;
    private RefundInfoDTO refundInfo;

    @Data
    @Builder
    public static class ReturnItemResponseDTO {
        private Long returnItemId;
        private Long orderItemId;
        private String productName;
        private String productImage;
        private String variantInfo;
        private Integer quantity;
        private String conditionNoted;
    }

    @Data
    @Builder
    public static class RefundInfoDTO {
        private Long refundId;
        private BigDecimal amount;
        private String method;
        private String status;
        private String proofImage;
    }
}
