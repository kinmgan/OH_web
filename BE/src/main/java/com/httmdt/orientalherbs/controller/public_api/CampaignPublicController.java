package com.httmdt.orientalherbs.controller.public_api;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.httmdt.orientalherbs.service.marketing_and_campaign.CampaignService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/public/campaigns")
@RequiredArgsConstructor
public class CampaignPublicController {

    private final CampaignService campaignService;

    @GetMapping("/web")
    public ResponseEntity<Object> getActiveWebCampaigns() {
        return ResponseEntity.ok(campaignService.getActiveWebCampaigns());
    }
}
