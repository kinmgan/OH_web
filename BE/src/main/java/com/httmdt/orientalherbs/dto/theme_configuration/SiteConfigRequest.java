package com.httmdt.orientalherbs.dto.theme_configuration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteConfigRequest {
    private String configValue;
    private String description;
}
