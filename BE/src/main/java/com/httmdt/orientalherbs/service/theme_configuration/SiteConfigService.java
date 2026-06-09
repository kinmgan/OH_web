package com.httmdt.orientalherbs.service.theme_configuration;

import com.httmdt.orientalherbs.dao.theme_configuration.SiteConfigRepository;
import com.httmdt.orientalherbs.dto.theme_configuration.SiteConfigDto;
import com.httmdt.orientalherbs.dto.theme_configuration.SiteConfigRequest;
import com.httmdt.orientalherbs.model.theme_configuration.SiteConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SiteConfigService {

    private final SiteConfigRepository siteConfigRepository;

    public List<SiteConfigDto> getAllConfigs() {
        return siteConfigRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Map<String, String> getAllConfigsAsMap() {
        return siteConfigRepository.findAll().stream()
                .collect(Collectors.toMap(SiteConfig::getConfigKey, SiteConfig::getConfigValue));
    }

    public SiteConfigDto updateConfig(String key, SiteConfigRequest request) {
        SiteConfig config = siteConfigRepository.findByConfigKey(key)
                .orElse(new SiteConfig());
        
        config.setConfigKey(key);
        config.setConfigValue(request.getConfigValue());
        if (request.getDescription() != null) {
            config.setDescription(request.getDescription());
        }
        
        SiteConfig savedConfig = siteConfigRepository.save(config);
        return mapToDto(savedConfig);
    }

    public SiteConfigDto getConfigByKey(String key) {
        return siteConfigRepository.findByConfigKey(key)
                .map(this::mapToDto)
                .orElse(null);
    }

    private SiteConfigDto mapToDto(SiteConfig config) {
        return SiteConfigDto.builder()
                .configKey(config.getConfigKey())
                .configValue(config.getConfigValue())
                .description(config.getDescription())
                .build();
    }
}
