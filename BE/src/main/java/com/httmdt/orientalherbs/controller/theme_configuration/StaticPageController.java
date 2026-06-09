package com.httmdt.orientalherbs.controller.theme_configuration;

import com.httmdt.orientalherbs.dto.theme_configuration.StaticPageDto;
import com.httmdt.orientalherbs.dto.theme_configuration.StaticPageRequest;
import com.httmdt.orientalherbs.service.theme_configuration.StaticPageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class StaticPageController {

    @Autowired
    private StaticPageService staticPageService;

    @GetMapping("/public/static-pages/{slug}")
    public ResponseEntity<StaticPageDto> getPage(@PathVariable String slug) {
        return ResponseEntity.ok(staticPageService.getPageBySlug(slug));
    }

    // Assuming you have security configured for /api/admin/** routes
    @PutMapping("/admin/static-pages/{slug}")
    public ResponseEntity<StaticPageDto> updatePage(
            @PathVariable String slug, 
            @RequestBody StaticPageRequest request) {
        return ResponseEntity.ok(staticPageService.updatePage(slug, request));
    }
}
