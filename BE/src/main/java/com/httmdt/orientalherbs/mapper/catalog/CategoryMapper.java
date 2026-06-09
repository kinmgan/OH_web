package com.httmdt.orientalherbs.mapper.catalog;

import com.httmdt.orientalherbs.dto.catalog.CategoryAdminRequestDto;
import com.httmdt.orientalherbs.dto.catalog.CategoryDto;
import com.httmdt.orientalherbs.model.catalog.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryDto toDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .cate_code(category.getCate_code())
                .productCount(
                        category.getProducts() != null
                                ? (long) category.getProducts().size()
                                : 0L
                )
                .displayOrder(category.getDisplayOrder() != null ? category.getDisplayOrder() : 0)
                .build();
    }

    public Category toEntity(CategoryAdminRequestDto requestDto) {
        Category category = new Category();
        category.setName(requestDto.getName());
        category.setDescription(requestDto.getDescription());
        category.setCate_code(requestDto.getCateCode());
        category.setDisplayOrder(requestDto.getDisplayOrder() != null ? requestDto.getDisplayOrder() : 0);
        return category;
    }

    public void updateEntity(Category category, CategoryAdminRequestDto requestDto) {
        category.setName(requestDto.getName());
        category.setDescription(requestDto.getDescription());
        category.setCate_code(requestDto.getCateCode());
        if (requestDto.getDisplayOrder() != null) {
            category.setDisplayOrder(requestDto.getDisplayOrder());
        }
    }
}
