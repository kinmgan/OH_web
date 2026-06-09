package com.httmdt.orientalherbs.service.marketing_and_campaign;

import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignCreateRequest;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignListItemResponse;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignResponse;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignStatusUpdateRequest;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignUpdateRequest;

import java.util.List;

import com.httmdt.orientalherbs.dto.common.PageResponseDto;
import com.httmdt.orientalherbs.model.enums.CampaignStatus;
import com.httmdt.orientalherbs.model.enums.CampaignType;

public interface CampaignService {

    CampaignResponse createCampaign(CampaignCreateRequest request);

    CampaignResponse updateCampaign(Long id, CampaignUpdateRequest request);

    CampaignResponse getCampaign(Long id);

    PageResponseDto<CampaignListItemResponse> getCampaigns(CampaignType type, CampaignStatus status, String keyword, int page, int size);

    void deleteOrCancelCampaign(Long id);

    CampaignResponse updateStatus(Long id, CampaignStatusUpdateRequest request);

    void validateNoOverlap(java.util.List<Long> variantIds, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate, Long excludeCampaignId);

    List<CampaignResponse> getActiveWebCampaigns();
}
