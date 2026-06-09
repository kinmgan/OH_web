package com.httmdt.orientalherbs.service.catalog;

import java.util.List;

import com.httmdt.orientalherbs.dto.catalog.HomepageSectionRequest;
import com.httmdt.orientalherbs.dto.catalog.HomepageSectionResponse;

public interface HomepageSectionService {

    List<HomepageSectionResponse> getAllSections();

    HomepageSectionResponse getSectionById(Long id);

    HomepageSectionResponse createSection(HomepageSectionRequest request);

    HomepageSectionResponse updateSection(Long id, HomepageSectionRequest request);

    void deleteSection(Long id);

    List<HomepageSectionResponse> getActiveSections();
}
