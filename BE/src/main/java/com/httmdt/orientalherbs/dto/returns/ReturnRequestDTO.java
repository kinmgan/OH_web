package com.httmdt.orientalherbs.dto.returns;

import java.util.List;

import com.httmdt.orientalherbs.model.enums.ReturnReason;

import lombok.Data;

@Data
public class ReturnRequestDTO {
    private ReturnReason reason;
    private String description;
    private List<String> evidenceImages;
    private List<ReturnItemDTO> items;

    @Data
    public static class ReturnItemDTO {
        private Long orderItemId;
        private Integer quantity;
        private String conditionNoted;
    }
}
