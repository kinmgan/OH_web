package com.httmdt.orientalherbs.service.catalog;

import com.httmdt.orientalherbs.dto.catalog.ProductDetailResponseDto;

public interface ProductDetailService {
    ProductDetailResponseDto getProductDetail(Long productId);
}
