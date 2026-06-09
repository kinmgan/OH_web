package com.httmdt.orientalherbs.service.catalog;

import com.httmdt.orientalherbs.dto.catalog.CategoryAdminRequestDto;
import com.httmdt.orientalherbs.dto.catalog.CategoryDto;
import java.util.List;

public interface CategoryService {
    List<CategoryDto> getAllCategories();
    CategoryDto getCategoryById(Long id);
    CategoryDto createCategory(CategoryAdminRequestDto requestDto);
    CategoryDto updateCategory(Long id, CategoryAdminRequestDto requestDto);
    void deleteCategory(Long id);
}
