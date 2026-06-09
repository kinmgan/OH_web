package com.httmdt.orientalherbs.service.catalog;

import com.httmdt.orientalherbs.dto.common.PageResponseDto;
import com.httmdt.orientalherbs.dto.catalog.ProductSummaryDto;

public interface ProductPublicService {
    PageResponseDto<ProductSummaryDto> getProducts(Long categoryId, String keyword, int page, int size, String sortBy, String sortDir);
}