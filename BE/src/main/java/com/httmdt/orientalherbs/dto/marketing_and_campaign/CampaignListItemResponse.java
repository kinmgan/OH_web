package com.httmdt.orientalherbs.dto.marketing_and_campaign;

import java.time.LocalDateTime;

import com.httmdt.orientalherbs.model.enums.CampaignStatus;
import com.httmdt.orientalherbs.model.enums.CampaignType;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class CampaignListItemResponse {
    private Long id;
    private String name;
    private CampaignType type;
    private CampaignStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime scheduledAt;
    private Integer itemCount;
    private Integer displayOrder;
    private Long totalSent; // Chỉ có giá trị với EMAIL campaign
}
