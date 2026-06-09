package com.httmdt.orientalherbs.controller.admin_api;

import com.httmdt.orientalherbs.dto.catalog.ProductAdminRequestDto;
import com.httmdt.orientalherbs.dto.catalog.ProductAdminResponseDto;
import com.httmdt.orientalherbs.service.catalog.ProductAdminService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/admin/products")
public class ProductAdminController {

    @Autowired
    private ProductAdminService productAdminService;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<Page<ProductAdminResponseDto>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ProductAdminResponseDto> products = productAdminService.getAllProducts(pageable, keyword);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductAdminResponseDto> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productAdminService.getProductById(id));
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<ProductAdminResponseDto> createProduct(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "images", required = false) List<MultipartFile> imageFiles,
            @RequestPart(value = "certificates", required = false) List<MultipartFile> certificateFiles) throws Exception {
        ProductAdminRequestDto requestDto = objectMapper.readValue(dataJson, ProductAdminRequestDto.class);
        return ResponseEntity.ok(productAdminService.createProduct(requestDto, imageFiles, certificateFiles));
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<ProductAdminResponseDto> updateProduct(
            @PathVariable Long id,
            @RequestPart("data") String dataJson,
            @RequestPart(value = "images", required = false) List<MultipartFile> imageFiles,
            @RequestPart(value = "certificates", required = false) List<MultipartFile> certificateFiles) throws Exception {
        ProductAdminRequestDto requestDto = objectMapper.readValue(dataJson, ProductAdminRequestDto.class);
        return ResponseEntity.ok(productAdminService.updateProduct(id, requestDto, imageFiles, certificateFiles));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productAdminService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
