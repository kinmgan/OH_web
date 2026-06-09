package com.httmdt.orientalherbs.controller.admin_api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.httmdt.orientalherbs.dto.common.PageResponseDto;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignCreateRequest;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignListItemResponse;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignResponse;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignStatusUpdateRequest;
import com.httmdt.orientalherbs.dto.marketing_and_campaign.CampaignUpdateRequest;
import com.httmdt.orientalherbs.model.enums.CampaignStatus;
import com.httmdt.orientalherbs.model.enums.CampaignType;
import com.httmdt.orientalherbs.service.marketing_and_campaign.CampaignService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/campaigns")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CampaignAdminController {

    private final CampaignService campaignService;

    @GetMapping
    public ResponseEntity<PageResponseDto<CampaignListItemResponse>> getCampaigns(
            @RequestParam(required = false) CampaignType type,
            @RequestParam(required = false) CampaignStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(campaignService.getCampaigns(type, status, keyword, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampaignResponse> getCampaign(@PathVariable Long id) {
        return ResponseEntity.ok(campaignService.getCampaign(id));
    }

    @PostMapping
    public ResponseEntity<CampaignResponse> createCampaign(
            @Valid @RequestBody CampaignCreateRequest request) {
        CampaignResponse campaign = campaignService.createCampaign(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(campaign);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampaignResponse> updateCampaign(
            @PathVariable Long id,
            @Valid @RequestBody CampaignUpdateRequest request) {
        return ResponseEntity.ok(campaignService.updateCampaign(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CampaignResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody CampaignStatusUpdateRequest request) {
        return ResponseEntity.ok(campaignService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(@PathVariable Long id) {
        campaignService.deleteOrCancelCampaign(id);
        return ResponseEntity.noContent().build();
    }
}
