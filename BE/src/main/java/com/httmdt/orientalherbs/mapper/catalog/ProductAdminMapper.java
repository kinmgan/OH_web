package com.httmdt.orientalherbs.mapper.catalog;

import com.httmdt.orientalherbs.dto.catalog.ProductAdminRequestDto;
import com.httmdt.orientalherbs.dto.catalog.ProductAdminResponseDto;
import com.httmdt.orientalherbs.dto.catalog.ProductImageDto;
import com.httmdt.orientalherbs.dto.catalog.ProductVariantDto;
import com.httmdt.orientalherbs.model.catalog.Product;
import com.httmdt.orientalherbs.model.catalog.ProductImage;
import com.httmdt.orientalherbs.model.catalog.ProductVariant;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class ProductAdminMapper {

    public Product toEntity(ProductAdminRequestDto dto) {
        if (dto == null) {
            return null;
        }
        Product product = new Product();
        product.setName(dto.getName());
        product.setSku(dto.getSku());
        product.setDescription(dto.getDescription());
        product.setOrigin(dto.getOrigin());
        product.setMinPrice(dto.getMinPrice());
        product.setProperties(dto.getProperties());
        product.setFlavors(dto.getFlavors());
        product.setMeridians(dto.getMeridians());
        product.setTags(dto.getTags());
        // Category will be mapped in Service
        
        return product;
    }

    public ProductAdminResponseDto toResponseDto(Product product) {
        if (product == null) {
            return null;
        }
        ProductAdminResponseDto dto = new ProductAdminResponseDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setSku(product.getSku());
        dto.setDescription(product.getDescription());
        dto.setOrigin(product.getOrigin());
        dto.setSoldQuantity(product.getSoldQuantity());
        dto.setAverageRating(product.getAverageRating());
        dto.setMinPrice(product.getMinPrice());
        
        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getId());
            dto.setCategoryName(product.getCategory().getName());
        }

        dto.setProperties(product.getProperties());
        dto.setFlavors(product.getFlavors());
        dto.setMeridians(product.getMeridians());
        dto.setTags(product.getTags());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setCertificateImages(product.getCertificateImages());

        if (product.getVariants() != null) {
            dto.setVariants(product.getVariants().stream().map(this::toVariantDto).collect(Collectors.toList()));
        }
        
        if (product.getImages() != null) {
            dto.setImages(product.getImages().stream().map(this::toImageDto).collect(Collectors.toList()));
        }

        return dto;
    }

    public ProductVariantDto toVariantDto(ProductVariant variant) {
        if (variant == null) {
            return null;
        }
        ProductVariantDto dto = new ProductVariantDto();
        dto.setProductVariantId(variant.getProductVariantId());
        dto.setUnitName(variant.getUnitName());
        dto.setPrice(variant.getPrice());
        dto.setStockQuantity(variant.getStockQuantity());
        dto.setWeightGram(variant.getWeightGram());
        dto.setLengthCm(variant.getLengthCm());
        dto.setWidthCm(variant.getWidthCm());
        dto.setHeightCm(variant.getHeightCm());
        return dto;
    }

    public ProductImageDto toImageDto(ProductImage image) {
        if (image == null) {
            return null;
        }
        ProductImageDto dto = new ProductImageDto();
        dto.setId(image.getId());
        dto.setProductImageUrl(image.getProductImageUrl());
        dto.setImagePublicId(image.getImagePublicId());
        dto.setIsDefault(image.getIsDefault());
        return dto;
    }
}
