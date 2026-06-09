package com.httmdt.orientalherbs.controller.public_api;

import com.httmdt.orientalherbs.service.theme_configuration.SiteConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/site-config")
@RequiredArgsConstructor
public class SiteConfigPublicController {

    private final SiteConfigService siteConfigService;

    @GetMapping
    public ResponseEntity<?> getAllConfigs() {
        return ResponseEntity.ok(siteConfigService.getAllConfigsAsMap());
    }
}
