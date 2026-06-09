package com.httmdt.orientalherbs.controller.public_api;

import com.httmdt.orientalherbs.dto.theme_configuration.ThemeConfigDto;
import com.httmdt.orientalherbs.service.theme_configuration.ThemeConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/theme")
@RequiredArgsConstructor
public class ThemeConfigPublicController {

    private final ThemeConfigService themeConfigService;

    @GetMapping("/active")
    public ResponseEntity<ThemeConfigDto> getActiveTheme() {
        ThemeConfigDto theme = themeConfigService.getActiveTheme();
        if (theme == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(theme);
    }
}
