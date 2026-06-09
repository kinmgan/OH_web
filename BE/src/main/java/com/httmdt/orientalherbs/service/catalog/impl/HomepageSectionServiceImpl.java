package com.httmdt.orientalherbs.service.catalog.impl;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.httmdt.orientalherbs.dao.catalog.CategoryRepository;
import com.httmdt.orientalherbs.dao.catalog.HomepageSectionRepository;
import com.httmdt.orientalherbs.dao.catalog.ProductRepository;
import com.httmdt.orientalherbs.dto.catalog.HomepageSectionRequest;
import com.httmdt.orientalherbs.dto.catalog.HomepageSectionResponse;
import com.httmdt.orientalherbs.dto.catalog.ProductSummaryDto;
import com.httmdt.orientalherbs.dto.pricing.PriceQuote;
import com.httmdt.orientalherbs.mapper.catalog.ProductMapper;
import com.httmdt.orientalherbs.model.catalog.Category;
import com.httmdt.orientalherbs.model.catalog.HomepageSection;
import com.httmdt.orientalherbs.model.catalog.Product;
import com.httmdt.orientalherbs.model.enums.HomepageSectionType;
import com.httmdt.orientalherbs.service.catalog.HomepageSectionService;
import com.httmdt.orientalherbs.service.pricing.PricingService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HomepageSectionServiceImpl implements HomepageSectionService {

    private final HomepageSectionRepository homepageSectionRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final PricingService pricingService;

    @Override
    public List<HomepageSectionResponse> getAllSections() {
        return homepageSectionRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public HomepageSectionResponse getSectionById(Long id) {
        HomepageSection section = homepageSectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khối với id: " + id));
        return toResponseWithProducts(section);
    }

    @Override
    @Transactional
    public HomepageSectionResponse createSection(HomepageSectionRequest request) {
        HomepageSection section = new HomepageSection();
        section.setTitle(request.getTitle());
        section.setType(request.getType());
        section.setReferenceId(request.getReferenceId());
        section.setSortOrder(request.getSortOrder());
        section.setLimitItems(request.getLimitItems() != null ? request.getLimitItems() : 10);
        section.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        HomepageSection saved = homepageSectionRepository.save(section);
        return toResponseWithProducts(saved);
    }

    @Override
    @Transactional
    public HomepageSectionResponse updateSection(Long id, HomepageSectionRequest request) {
        HomepageSection section = homepageSectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khối với id: " + id));

        section.setTitle(request.getTitle());
        section.setType(request.getType());
        section.setReferenceId(request.getReferenceId());
        section.setSortOrder(request.getSortOrder());
        section.setLimitItems(request.getLimitItems() != null ? request.getLimitItems() : 10);
        section.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        HomepageSection saved = homepageSectionRepository.save(section);
        return toResponseWithProducts(saved);
    }

    @Override
    @Transactional
    public void deleteSection(Long id) {
        if (!homepageSectionRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy khối với id: " + id);
        }
        homepageSectionRepository.deleteById(id);
    }

    @Override
    public List<HomepageSectionResponse> getActiveSections() {
        return homepageSectionRepository.findAllByIsActiveTrueOrderBySortOrderAsc().stream()
                .map(this::toResponseWithProducts)
                .collect(Collectors.toList());
    }

    private HomepageSectionResponse toResponse(HomepageSection section) {
        HomepageSectionResponse response = new HomepageSectionResponse();
        response.setId(section.getId());
        response.setTitle(section.getTitle());
        response.setType(section.getType());
        response.setReferenceId(section.getReferenceId());
        response.setSortOrder(section.getSortOrder());
        response.setLimitItems(section.getLimitItems());
        response.setIsActive(section.getIsActive());

        if (section.getType() == HomepageSectionType.CATEGORY && section.getReferenceId() != null) {
            categoryRepository.findById(section.getReferenceId())
                    .ifPresent(cat -> response.setCategoryName(cat.getName()));
        }

        return response;
    }

    private HomepageSectionResponse toResponseWithProducts(HomepageSection section) {
        HomepageSectionResponse response = toResponse(section);

        List<Product> products = fetchProductsByType(section);
        Map<Long, PriceQuote> priceQuotes = getPriceQuotes(products);

        List<ProductSummaryDto> productDtos = products.stream()
                .map(product -> productMapper.toSummaryDto(product, priceQuotes))
                .collect(Collectors.toList());

        response.setProducts(productDtos);
        return response;
    }

    private List<Product> fetchProductsByType(HomepageSection section) {
        int limit = section.getLimitItems() != null ? section.getLimitItems() : 10;
        PageRequest pageable = PageRequest.of(0, limit);

        switch (section.getType()) {
            case CATEGORY:
                if (section.getReferenceId() != null) {
                    return productRepository.findByCategoryIdOrderByIdDesc(section.getReferenceId(), pageable)
                            .getContent();
                }
                return List.of();
            case TOP_SALES:
                return productRepository.findByOrderBySoldQuantityDesc(pageable);
            case TOP_RATED:
                return productRepository.findByOrderByAverageRatingDesc(pageable);
            case NEW_ARRIVALS:
                return productRepository.findByOrderByCreatedAtDesc(pageable);
            default:
                return List.of();
        }
    }

    private Map<Long, PriceQuote> getPriceQuotes(List<Product> products) {
        if (products.isEmpty()) {
            return Map.of();
        }
        List<Long> variantIds = products.stream()
                .flatMap(p -> p.getVariants().stream())
                .map(v -> v.getProductVariantId())
                .collect(Collectors.toList());
        return pricingService.quoteBatch(variantIds);
    }
}
