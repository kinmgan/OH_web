package com.httmdt.orientalherbs.controller.admin_api;

import com.httmdt.orientalherbs.dao.catalog.HomepageSectionRepository;
import com.httmdt.orientalherbs.dto.catalog.HomepageSectionRequest;
import com.httmdt.orientalherbs.dto.catalog.HomepageSectionResponse;
import com.httmdt.orientalherbs.model.catalog.HomepageSection;
import com.httmdt.orientalherbs.service.catalog.HomepageSectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/homepage-sections")
@RequiredArgsConstructor
public class HomepageSectionAdminController {

    private final HomepageSectionService homepageSectionService;
    private final HomepageSectionRepository homepageSectionRepository;

    @GetMapping
    public ResponseEntity<List<HomepageSectionResponse>> getAllSections() {
        return ResponseEntity.ok(homepageSectionService.getAllSections());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HomepageSectionResponse> getSectionById(@PathVariable Long id) {
        return ResponseEntity.ok(homepageSectionService.getSectionById(id));
    }

    @PostMapping
    public ResponseEntity<HomepageSectionResponse> createSection(@Valid @RequestBody HomepageSectionRequest request) {
        return ResponseEntity.ok(homepageSectionService.createSection(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HomepageSectionResponse> updateSection(
            @PathVariable Long id,
            @Valid @RequestBody HomepageSectionRequest request) {
        return ResponseEntity.ok(homepageSectionService.updateSection(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSection(@PathVariable Long id) {
        homepageSectionService.deleteSection(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/reorder")
    public ResponseEntity<List<HomepageSectionResponse>> updateSortOrder(@RequestBody List<Map<String, Long>> orderList) {
        for (Map<String, Long> item : orderList) {
            Long id = item.get("id");
            Integer sortOrder = item.get("sortOrder") != null ? item.get("sortOrder").intValue() : 0;
            HomepageSection section = homepageSectionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy khối với id: " + id));
            section.setSortOrder(sortOrder);
            homepageSectionRepository.save(section);
        }
        return ResponseEntity.ok(homepageSectionService.getAllSections());
    }
}
