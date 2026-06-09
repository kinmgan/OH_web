package com.httmdt.orientalherbs.controller.public_api;

import com.httmdt.orientalherbs.dto.catalog.HomepageSectionResponse;
import com.httmdt.orientalherbs.service.catalog.HomepageSectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/public/homepage/sections")
public class HomepageSectionPublicController {

    private final HomepageSectionService homepageSectionService;

    public HomepageSectionPublicController(HomepageSectionService homepageSectionService) {
        this.homepageSectionService = homepageSectionService;
    }

    @GetMapping
    public ResponseEntity<List<HomepageSectionResponse>> getActiveSections() {
        return ResponseEntity.ok(homepageSectionService.getActiveSections());
    }
}
