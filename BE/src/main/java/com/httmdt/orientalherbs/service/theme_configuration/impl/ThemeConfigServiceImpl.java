package com.httmdt.orientalherbs.service.theme_configuration.impl;

import com.httmdt.orientalherbs.dao.theme_configuration.ThemeConfigRepository;
import com.httmdt.orientalherbs.dto.theme_configuration.ThemeConfigDto;
import com.httmdt.orientalherbs.dto.theme_configuration.ThemeConfigRequest;
import com.httmdt.orientalherbs.model.theme_configuration.ThemeConfig;
import com.httmdt.orientalherbs.service.theme_configuration.ThemeConfigService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ThemeConfigServiceImpl implements ThemeConfigService {

    private final ThemeConfigRepository themeConfigRepository;

    public ThemeConfigServiceImpl(ThemeConfigRepository themeConfigRepository) {
        this.themeConfigRepository = themeConfigRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ThemeConfigDto getActiveTheme() {
        return themeConfigRepository.findByIsActiveTrue()
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public ThemeConfigDto getThemeById(Long id) {
        return themeConfigRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("ThemeConfig not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ThemeConfigDto> getAllThemes() {
        return themeConfigRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public ThemeConfigDto updateTheme(Long id, ThemeConfigRequest request) {
        ThemeConfig theme = themeConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ThemeConfig not found with id: " + id));

        if (request.getThemeName() != null) {
            theme.setThemeName(request.getThemeName());
        }
        if (request.getCoverImageUrl() != null) {
            theme.setCoverImageUrl(clean(request.getCoverImageUrl()));
        }
        if (request.getHeaderImage1Url() != null) {
            theme.setHeaderImage1Url(clean(request.getHeaderImage1Url()));
        }
        if (request.getHeaderImage2Url() != null) {
            theme.setHeaderImage2Url(clean(request.getHeaderImage2Url()));
        }
        if (request.getHeaderImage3Url() != null) {
            theme.setHeaderImage3Url(clean(request.getHeaderImage3Url()));
        }
        if (request.getHeaderVideoUrl() != null) {
            theme.setHeaderVideoUrl(clean(request.getHeaderVideoUrl()));
        }
        if (request.getPromotionImageUrl() != null) {
            theme.setPromotionImageUrl(clean(request.getPromotionImageUrl()));
        }
        if (request.getPromotionImageLink() != null) {
            theme.setPromotionImageLink(clean(request.getPromotionImageLink()));
        }
        if (request.getIsActive() != null) {
            theme.setIsActive(request.getIsActive());
        }

        return toDto(themeConfigRepository.save(theme));
    }

    private ThemeConfigDto toDto(ThemeConfig theme) {
        return ThemeConfigDto.builder()
                .id(theme.getId())
                .themeName(theme.getThemeName())
                .coverImageUrl(theme.getCoverImageUrl())
                .headerImage1Url(theme.getHeaderImage1Url())
                .headerImage2Url(theme.getHeaderImage2Url())
                .headerImage3Url(theme.getHeaderImage3Url())
                .headerVideoUrl(theme.getHeaderVideoUrl())
                .promotionImageUrl(theme.getPromotionImageUrl())
                .promotionImageLink(theme.getPromotionImageLink())
                .isActive(theme.getIsActive())
                .updatedAt(theme.getUpdatedAt())
                .build();
    }

    private String clean(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
