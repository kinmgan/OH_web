package com.httmdt.orientalherbs.dto.marketing_and_campaign;

import java.time.LocalDateTime;
import java.util.List;

import com.httmdt.orientalherbs.model.enums.CampaignStatus;
import com.httmdt.orientalherbs.model.enums.CampaignType;
import com.httmdt.orientalherbs.model.enums.HealthCategory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CampaignCreateRequest {

    @NotBlank(message = "Campaign name is required")
    private String name;

    private String description;

    @NotNull(message = "Campaign type is required")
    private CampaignType type;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private LocalDateTime scheduledAt;

    private Integer displayOrder;

    private HealthCategory targetHealthCategory;

    private Long templateId;

    @Valid
    private List<CampaignProductVariantRequest> items;
}
