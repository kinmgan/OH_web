package com.httmdt.orientalherbs.dto.theme_configuration;

import lombok.Data;

@Data
public class StaticPageDto {
    private Long id;
    private String slug;
    private String title;
    private String content;
}
