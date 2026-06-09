package com.httmdt.orientalherbs.service.theme_configuration;

import com.httmdt.orientalherbs.dto.theme_configuration.ThemeConfigDto;
import com.httmdt.orientalherbs.dto.theme_configuration.ThemeConfigRequest;

import java.util.List;

public interface ThemeConfigService {
    List<ThemeConfigDto> getAllThemes();
    ThemeConfigDto getThemeById(Long id);
    ThemeConfigDto getActiveTheme();
    ThemeConfigDto updateTheme(Long id, ThemeConfigRequest request);
}
