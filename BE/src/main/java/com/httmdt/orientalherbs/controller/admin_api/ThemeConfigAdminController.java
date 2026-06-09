package com.httmdt.orientalherbs.controller.admin_api;

import com.httmdt.orientalherbs.dto.theme_configuration.ThemeConfigDto;
import com.httmdt.orientalherbs.dto.theme_configuration.ThemeConfigRequest;
import com.httmdt.orientalherbs.service.theme_configuration.ThemeConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/theme")
@RequiredArgsConstructor
public class ThemeConfigAdminController {

    private final ThemeConfigService themeConfigService;

    @GetMapping
    public ResponseEntity<List<ThemeConfigDto>> getAllThemes() {
        return ResponseEntity.ok(themeConfigService.getAllThemes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ThemeConfigDto> getThemeById(@PathVariable Long id) {
        return ResponseEntity.ok(themeConfigService.getThemeById(id));
    }

    @GetMapping("/active")
    public ResponseEntity<ThemeConfigDto> getActiveTheme() {
        ThemeConfigDto theme = themeConfigService.getActiveTheme();
        if (theme == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(theme);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ThemeConfigDto> updateTheme(
            @PathVariable Long id,
            @Valid @RequestBody ThemeConfigRequest request) {
        return ResponseEntity.ok(themeConfigService.updateTheme(id, request));
    }
}
