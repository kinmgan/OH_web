package com.httmdt.orientalherbs.dto.marketing_and_campaign;

import com.httmdt.orientalherbs.model.enums.CampaignStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CampaignStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private CampaignStatus status;
}
