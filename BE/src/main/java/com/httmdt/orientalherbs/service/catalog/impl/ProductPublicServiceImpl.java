package com.httmdt.orientalherbs.service.catalog.impl;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.httmdt.orientalherbs.dao.catalog.ProductRepository;
import com.httmdt.orientalherbs.dto.catalog.ProductSummaryDto;
import com.httmdt.orientalherbs.dto.common.PageResponseDto;
import com.httmdt.orientalherbs.dto.pricing.PriceQuote;
import com.httmdt.orientalherbs.mapper.catalog.ProductMapper;
import com.httmdt.orientalherbs.model.catalog.Product;
import com.httmdt.orientalherbs.service.catalog.ProductPublicService;
import com.httmdt.orientalherbs.service.pricing.PricingService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductPublicServiceImpl implements ProductPublicService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final PricingService pricingService;

    @Override
    public PageResponseDto<ProductSummaryDto> getProducts(Long categoryId, String keyword, int page, int size, String sortBy,
            String sortDir) {
        boolean isNativeQuery = (keyword != null && !keyword.trim().isEmpty()) || categoryId != null;

        String entityProperty;
        switch (sortBy.toLowerCase()) {
            case "price":
                entityProperty = isNativeQuery ? "min_price" : "minPrice";
                break;
            case "name":
                entityProperty = "name";
                break;
            case "soldquantity":
                entityProperty = isNativeQuery ? "sold_quantity" : "soldQuantity";
                break;
            case "rate":
                entityProperty = isNativeQuery ? "average_rating" : "averageRating";
                break;
            default:
                entityProperty = "id";
        }

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(entityProperty).ascending()
                : Sort.by(entityProperty).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Product> productPage;

        if (isNativeQuery) {
            String searchKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
            productPage = productRepository.searchProducts(categoryId, searchKeyword, pageable);
        } else {
            productPage = productRepository.findAll(pageable);
        }

        List<Long> allVariantIds = productPage.getContent().stream()
                .flatMap(p -> p.getVariants().stream())
                .map(v -> v.getProductVariantId())
                .collect(Collectors.toList());

        Map<Long, PriceQuote> priceQuotes = pricingService.quoteBatch(allVariantIds);

        List<ProductSummaryDto> content = productPage.getContent().stream()
                .map(product -> productMapper.toSummaryDto(product, priceQuotes))
                .collect(Collectors.toList());

        PageResponseDto<ProductSummaryDto> response = new PageResponseDto<>();
        response.setContent(content);
        response.setPageNo(productPage.getNumber());
        response.setPageSize(productPage.getSize());
        response.setTotalElements(productPage.getTotalElements());
        response.setTotalPages(productPage.getTotalPages());
        response.setLast(productPage.isLast());

        return response;
    }
}