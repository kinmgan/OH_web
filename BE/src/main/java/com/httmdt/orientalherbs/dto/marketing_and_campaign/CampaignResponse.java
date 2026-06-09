package com.httmdt.orientalherbs.dto.marketing_and_campaign;

import java.time.LocalDateTime;
import java.util.List;

import com.httmdt.orientalherbs.model.enums.CampaignStatus;
import com.httmdt.orientalherbs.model.enums.CampaignType;
import com.httmdt.orientalherbs.model.enums.HealthCategory;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class CampaignResponse {
    private Long id;
    private String name;
    private String description;
    private CampaignType type;
    private CampaignStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime scheduledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CampaignProductVariantResponse> items;
    private Integer displayOrder;

    // Fields dành riêng cho EMAIL campaign
    private HealthCategory targetHealthCategory;
    private Long templateId;
    private Long totalSent;
}
