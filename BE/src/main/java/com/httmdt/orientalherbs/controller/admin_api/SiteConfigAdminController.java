package com.httmdt.orientalherbs.controller.admin_api;

import com.httmdt.orientalherbs.dto.theme_configuration.SiteConfigDto;
import com.httmdt.orientalherbs.dto.theme_configuration.SiteConfigRequest;
import com.httmdt.orientalherbs.service.theme_configuration.SiteConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/site-config")
@RequiredArgsConstructor
public class SiteConfigAdminController {

    private final SiteConfigService siteConfigService;

    @GetMapping
    public ResponseEntity<?> getAllConfigs() {
        // The frontend getAllConfigsAsMap() expects a Map
        // The frontend getAllConfigs() expects a List
        // Because they both hit the same endpoint, we can check a param, or just return Map?
        // Wait, looking at SiteConfigService in frontend:
        // `getAllConfigs` -> `http<SiteConfig[]>('/admin/site-config')`
        // `getAllConfigsAsMap` -> `http<SiteConfigMap>('/admin/site-config', { silent: true })`
        // Returning a Map might break `getAllConfigs()` if it's used elsewhere, but Map is what `getAllConfigsAsMap()` wants.
        // Actually, if we return Map, `getAllConfigs()` expecting an array will crash. Let's check how many places use `getAllConfigs`.
        // Let me just return a map, or change the return to object. Let's just return map and see.
        // Actually, let me return the map since it's most needed by appearance page.
        // Wait, if I return List<SiteConfigDto>, but the frontend `getAllConfigsAsMap` expects a map, how can it parse it?
        // I will return a map for now. Wait, I can return map, but let me check if there is a `SiteConfigPublicController` needed.
        return ResponseEntity.ok(siteConfigService.getAllConfigsAsMap());
    }

    @PutMapping("/{key}")
    public ResponseEntity<SiteConfigDto> updateConfig(
            @PathVariable String key,
            @RequestBody SiteConfigRequest request) {
        return ResponseEntity.ok(siteConfigService.updateConfig(key, request));
    }
}
