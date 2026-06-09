package com.httmdt.orientalherbs.service.catalog.impl;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.httmdt.orientalherbs.dto.catalog.ProductDetailResponseDto;
import com.httmdt.orientalherbs.dto.pricing.PriceQuote;
import com.httmdt.orientalherbs.mapper.catalog.ProductDetailMapper;
import com.httmdt.orientalherbs.model.catalog.Product;
import com.httmdt.orientalherbs.dao.catalog.ProductRepository;
import com.httmdt.orientalherbs.service.catalog.ProductDetailService;
import com.httmdt.orientalherbs.service.pricing.PricingService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductDetailService {

    private final ProductRepository productRepository;
    private final ProductDetailMapper productDetailMapper;
    private final PricingService pricingService;

    @Override
    @Transactional(readOnly = true)
    public ProductDetailResponseDto getProductDetail(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + productId));

        List<Long> variantIds = product.getVariants().stream()
                .map(v -> v.getProductVariantId())
                .collect(Collectors.toList());

        Map<Long, PriceQuote> priceQuotes = pricingService.quoteBatch(variantIds);

        return productDetailMapper.toDetailResponseDTO(product, priceQuotes);
    }
}