package com.httmdt.orientalherbs.service.theme_configuration;

import com.httmdt.orientalherbs.dto.theme_configuration.StaticPageDto;
import com.httmdt.orientalherbs.dto.theme_configuration.StaticPageRequest;

public interface StaticPageService {
    StaticPageDto getPageBySlug(String slug);
    StaticPageDto updatePage(String slug, StaticPageRequest request);
}
