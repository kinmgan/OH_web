package com.httmdt.orientalherbs.dto.theme_configuration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThemeConfigRequest {
    private String themeName;
    private String coverImageUrl;
    private String headerImage1Url;
    private String headerImage2Url;
    private String headerImage3Url;
    private String headerVideoUrl;
    private String promotionImageUrl;
    private String promotionImageLink;
    private Boolean isActive;
}
