package com.httmdt.orientalherbs.controller.public_api;

import com.httmdt.orientalherbs.dto.common.PageResponseDto;
import com.httmdt.orientalherbs.dto.catalog.ProductDetailResponseDto;
import com.httmdt.orientalherbs.dto.catalog.ProductSummaryDto;
import com.httmdt.orientalherbs.service.catalog.ProductPublicService;
import com.httmdt.orientalherbs.service.catalog.ProductDetailService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public/products")
public class ProductPublicController {

    private final ProductPublicService productPublicService;
    private final ProductDetailService productDetailService;

    public ProductPublicController(ProductPublicService productPublicService,
            ProductDetailService productDetailService) {
        this.productPublicService = productPublicService;
        this.productDetailService = productDetailService;
    }

    @GetMapping
    public ResponseEntity<PageResponseDto<ProductSummaryDto>> getProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        // sortBy hỗ trợ truyền: "price", "name", "soldQuantity", "rate"
        return ResponseEntity.ok(productPublicService.getProducts(categoryId, keyword, page, size, sortBy, sortDir));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailResponseDto> getProductDetail(@PathVariable Long id) {
        return ResponseEntity.ok(productDetailService.getProductDetail(id));
    }
}