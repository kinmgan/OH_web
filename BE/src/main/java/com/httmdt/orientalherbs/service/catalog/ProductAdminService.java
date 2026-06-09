package com.httmdt.orientalherbs.service.catalog;

import com.httmdt.orientalherbs.dto.catalog.ProductAdminRequestDto;
import com.httmdt.orientalherbs.dto.catalog.ProductAdminResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface ProductAdminService {
    Page<ProductAdminResponseDto> getAllProducts(Pageable pageable, String keyword);
    ProductAdminResponseDto getProductById(Long id);
    ProductAdminResponseDto createProduct(ProductAdminRequestDto requestDto, List<MultipartFile> imageFiles, List<MultipartFile> certificateFiles);
    ProductAdminResponseDto updateProduct(Long id, ProductAdminRequestDto requestDto, List<MultipartFile> imageFiles, List<MultipartFile> certificateFiles);
    void deleteProduct(Long id);
}
