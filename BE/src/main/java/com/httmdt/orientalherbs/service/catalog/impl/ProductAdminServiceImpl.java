package com.httmdt.orientalherbs.service.catalog.impl;

import com.httmdt.orientalherbs.dao.catalog.CategoryRepository;
import com.httmdt.orientalherbs.dao.catalog.ProductRepository;
import com.httmdt.orientalherbs.dto.catalog.ProductAdminRequestDto;
import com.httmdt.orientalherbs.dto.catalog.ProductAdminResponseDto;
import com.httmdt.orientalherbs.dto.catalog.ProductVariantDto;
import com.httmdt.orientalherbs.mapper.catalog.ProductAdminMapper;
import com.httmdt.orientalherbs.model.catalog.Category;
import com.httmdt.orientalherbs.model.catalog.Product;
import com.httmdt.orientalherbs.model.catalog.ProductImage;
import com.httmdt.orientalherbs.model.catalog.ProductVariant;
import com.httmdt.orientalherbs.service.CloudinaryService;
import com.httmdt.orientalherbs.service.catalog.ProductAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductAdminServiceImpl implements ProductAdminService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductAdminMapper productAdminMapper;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductAdminResponseDto> getAllProducts(Pageable pageable, String keyword) {
        Page<Product> products = productRepository.searchProducts(null, keyword, pageable);
        return products.map(productAdminMapper::toResponseDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductAdminResponseDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return productAdminMapper.toResponseDto(product);
    }

    @Override
    @Transactional
    public ProductAdminResponseDto createProduct(ProductAdminRequestDto requestDto, List<MultipartFile> imageFiles, List<MultipartFile> certificateFiles) {
        Product product = productAdminMapper.toEntity(requestDto);

        Category category = categoryRepository.findById(requestDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        product.setCategory(category);

        // Map variants
        if (requestDto.getVariants() != null && !requestDto.getVariants().isEmpty()) {
            List<ProductVariant> variants = requestDto.getVariants().stream().map(dto -> {
                ProductVariant variant = new ProductVariant();
                variant.setUnitName(dto.getUnitName());
                variant.setPrice(dto.getPrice());
                variant.setStockQuantity(dto.getStockQuantity());
                variant.setWeightGram(dto.getWeightGram() != null ? dto.getWeightGram() : 0);
                variant.setLengthCm(dto.getLengthCm() != null ? dto.getLengthCm() : 0);
                variant.setWidthCm(dto.getWidthCm() != null ? dto.getWidthCm() : 0);
                variant.setHeightCm(dto.getHeightCm() != null ? dto.getHeightCm() : 0);
                variant.setProduct(product);
                return variant;
            }).collect(Collectors.toList());
            product.setVariants(variants);
        }

        // Map images to cloudinary
        List<ProductImage> productImages = new ArrayList<>();
        if (imageFiles != null && !imageFiles.isEmpty()) {
            int newIdx = 0;
            String defaultIdentifier = requestDto.getDefaultImageIdentifier();
            for (MultipartFile file : imageFiles) {
                try {
                    Map<String, Object> uploadResult = cloudinaryService.uploadImage(file, "oriental_herbs/products");
                    ProductImage image = new ProductImage();
                    image.setProductImageUrl(uploadResult.get("url").toString());
                    image.setImagePublicId(uploadResult.get("public_id").toString());
                    
                    if (defaultIdentifier != null && defaultIdentifier.equals("new_" + newIdx)) {
                        image.setIsDefault(true);
                    } else if ((defaultIdentifier == null || defaultIdentifier.isEmpty()) && newIdx == 0) {
                        image.setIsDefault(true);
                    } else {
                        image.setIsDefault(false);
                    }
                    
                    image.setProduct(product);
                    productImages.add(image);
                    newIdx++;
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload image", e);
                }
            }
        }
        product.setImages(productImages);

        // Upload certificates
        List<String> certificates = new ArrayList<>();
        if (certificateFiles != null && !certificateFiles.isEmpty()) {
            for (MultipartFile file : certificateFiles) {
                try {
                    Map<String, Object> uploadResult = cloudinaryService.uploadImage(file, "oriental_herbs/certificates");
                    certificates.add(uploadResult.get("url").toString());
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload certificate image", e);
                }
            }
        }
        product.setCertificateImages(certificates);

        Product savedProduct = productRepository.save(product);
        return productAdminMapper.toResponseDto(savedProduct);
    }

    @Override
    @Transactional
    public ProductAdminResponseDto updateProduct(Long id, ProductAdminRequestDto requestDto, List<MultipartFile> imageFiles, List<MultipartFile> certificateFiles) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.setName(requestDto.getName());
        product.setSku(requestDto.getSku());
        product.setDescription(requestDto.getDescription());
        product.setOrigin(requestDto.getOrigin());
        product.setMinPrice(requestDto.getMinPrice());
        product.setProperties(requestDto.getProperties());
        product.setFlavors(requestDto.getFlavors());
        product.setMeridians(requestDto.getMeridians());
        product.setTags(requestDto.getTags());

        if (!product.getCategory().getId().equals(requestDto.getCategoryId())) {
            Category category = categoryRepository.findById(requestDto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        }

        // Handle variants intelligently (merge and update)
        if (requestDto.getVariants() != null) {
            List<ProductVariant> existingVariants = product.getVariants();
            List<ProductVariant> newVariants = new ArrayList<>();

            for (ProductVariantDto dto : requestDto.getVariants()) {
                if (dto.getProductVariantId() != null) {
                    ProductVariant existing = existingVariants.stream()
                            .filter(v -> v.getProductVariantId().equals(dto.getProductVariantId()))
                            .findFirst()
                            .orElse(null);

                    if (existing != null) {
                        existing.setUnitName(dto.getUnitName());
                        existing.setPrice(dto.getPrice());
                        existing.setStockQuantity(dto.getStockQuantity());
                        existing.setWeightGram(dto.getWeightGram() != null ? dto.getWeightGram() : 0);
                        existing.setLengthCm(dto.getLengthCm() != null ? dto.getLengthCm() : 0);
                        existing.setWidthCm(dto.getWidthCm() != null ? dto.getWidthCm() : 0);
                        existing.setHeightCm(dto.getHeightCm() != null ? dto.getHeightCm() : 0);
                        newVariants.add(existing);
                        continue;
                    }
                }
                
                // If id is null or not found, create new
                ProductVariant variant = new ProductVariant();
                variant.setUnitName(dto.getUnitName());
                variant.setPrice(dto.getPrice());
                variant.setStockQuantity(dto.getStockQuantity());
                variant.setWeightGram(dto.getWeightGram() != null ? dto.getWeightGram() : 0);
                variant.setLengthCm(dto.getLengthCm() != null ? dto.getLengthCm() : 0);
                variant.setWidthCm(dto.getWidthCm() != null ? dto.getWidthCm() : 0);
                variant.setHeightCm(dto.getHeightCm() != null ? dto.getHeightCm() : 0);
                variant.setProduct(product);
                newVariants.add(variant);
            }

            existingVariants.retainAll(newVariants);
            for (ProductVariant v : newVariants) {
                if (!existingVariants.contains(v)) {
                    existingVariants.add(v);
                }
            }
        } else {
            product.getVariants().clear();
        }

        // Handle images
        List<String> keepPublicIds = requestDto.getKeepImagePublicIds();
        if (keepPublicIds == null) keepPublicIds = new ArrayList<>();

        List<ProductImage> toRemove = new ArrayList<>();
        for (ProductImage img : product.getImages()) {
            if (!keepPublicIds.contains(img.getImagePublicId())) {
                try {
                    cloudinaryService.deleteImage(img.getImagePublicId());
                    toRemove.add(img);
                } catch (Exception e) {
                    System.err.println("Could not delete image from Cloudinary: " + img.getImagePublicId());
                }
            }
        }
        product.getImages().removeAll(toRemove);

        // Upload new images
        String defaultIdentifier = requestDto.getDefaultImageIdentifier();
        if (imageFiles != null && !imageFiles.isEmpty()) {
            int newIdx = 0;
            for (MultipartFile file : imageFiles) {
                try {
                    Map<String, Object> uploadResult = cloudinaryService.uploadImage(file, "oriental_herbs/products");
                    ProductImage image = new ProductImage();
                    image.setProductImageUrl(uploadResult.get("url").toString());
                    image.setImagePublicId(uploadResult.get("public_id").toString());
                    
                    if (defaultIdentifier != null && defaultIdentifier.equals("new_" + newIdx)) {
                        image.setIsDefault(true);
                    } else {
                        image.setIsDefault(false);
                    }
                    
                    image.setProduct(product);
                    product.getImages().add(image);
                    newIdx++;
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload image", e);
                }
            }
        }

        // reset isDefault status
        boolean hasDefault = false;
        for (ProductImage img : product.getImages()) {
            if (defaultIdentifier != null && defaultIdentifier.equals(img.getImagePublicId())) {
                img.setIsDefault(true);
                hasDefault = true;
            } else if (img.getIsDefault() != null && img.getIsDefault() && defaultIdentifier != null && defaultIdentifier.startsWith("new_")) {
                hasDefault = true;
            } else {
                img.setIsDefault(false);
            }
        }
        
        if (!hasDefault && !product.getImages().isEmpty()) {
            product.getImages().get(0).setIsDefault(true);
        }

        // Handle certificates
        List<String> oldCertificates = product.getCertificateImages();
        List<String> keepCertificates = requestDto.getKeepCertificateImages();
        if (keepCertificates == null) keepCertificates = new ArrayList<>();
        
        if (oldCertificates != null) {
            for (String oldUrl : oldCertificates) {
                if (!keepCertificates.contains(oldUrl)) {
                    try {
                        String publicId = extractPublicIdFromUrl(oldUrl);
                        if (publicId != null) cloudinaryService.deleteImage(publicId);
                    } catch (Exception e) {
                        System.err.println("Could not delete certificate from Cloudinary: " + oldUrl);
                    }
                }
            }
        }
        
        List<String> updatedCertificates = new ArrayList<>(keepCertificates);
        if (certificateFiles != null && !certificateFiles.isEmpty()) {
            for (MultipartFile file : certificateFiles) {
                try {
                    Map<String, Object> uploadResult = cloudinaryService.uploadImage(file, "oriental_herbs/certificates");
                    updatedCertificates.add(uploadResult.get("url").toString());
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload certificate image", e);
                }
            }
        }
        product.setCertificateImages(updatedCertificates);

        Product savedProduct = productRepository.save(product);
        return productAdminMapper.toResponseDto(savedProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Delete images from Cloudinary
        for (ProductImage img : product.getImages()) {
            try {
                cloudinaryService.deleteImage(img.getImagePublicId());
            } catch (Exception e) {
                 System.err.println("Could not delete image from Cloudinary: " + img.getImagePublicId());
            }
        }

        productRepository.delete(product);
    }

    private String extractPublicIdFromUrl(String url) {
        if (url == null) return null;
        try {
            int uploadIdx = url.indexOf("/upload/");
            if (uploadIdx == -1) return null;
            String afterUpload = url.substring(uploadIdx + 8);
            int slashIdx = afterUpload.indexOf("/");
            if (slashIdx == -1) return null;
            String publicIdWithExt = afterUpload.substring(slashIdx + 1);
            int dotIdx = publicIdWithExt.lastIndexOf(".");
            if (dotIdx != -1) {
                return publicIdWithExt.substring(0, dotIdx);
            }
            return publicIdWithExt;
        } catch (Exception e) {
            return null;
        }
    }
}
