package com.httmdt.orientalherbs.service.theme_configuration;

import com.httmdt.orientalherbs.dao.theme_configuration.StaticPageRepository;
import com.httmdt.orientalherbs.dto.theme_configuration.StaticPageDto;
import com.httmdt.orientalherbs.dto.theme_configuration.StaticPageRequest;
import com.httmdt.orientalherbs.model.theme_configuration.StaticPage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class StaticPageServiceImpl implements StaticPageService {

    @Autowired
    private StaticPageRepository staticPageRepository;

    @Override
    public StaticPageDto getPageBySlug(String slug) {
        StaticPage page = staticPageRepository.findBySlug(slug).orElseGet(() -> {
            StaticPage newPage = new StaticPage();
            newPage.setSlug(slug);
            if (slug.equals("chinh-sach")) {
                newPage.setTitle("Chính sách Mua hàng & Hỗ trợ");
            } else {
                newPage.setTitle("Trang mới");
            }
            newPage.setContent("");
            return staticPageRepository.save(newPage);
        });
        
        return mapToDto(page);
    }

    @Override
    public StaticPageDto updatePage(String slug, StaticPageRequest request) {
        StaticPage page = staticPageRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Page not found"));
                
        page.setTitle(request.getTitle());
        page.setContent(request.getContent());
        
        return mapToDto(staticPageRepository.save(page));
    }
    
    private StaticPageDto mapToDto(StaticPage page) {
        StaticPageDto dto = new StaticPageDto();
        dto.setId(page.getId());
        dto.setSlug(page.getSlug());
        dto.setTitle(page.getTitle());
        dto.setContent(page.getContent());
        return dto;
    }
}
