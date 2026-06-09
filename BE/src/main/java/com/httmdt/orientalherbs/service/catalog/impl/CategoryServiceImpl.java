package com.httmdt.orientalherbs.service.catalog.impl;

import com.httmdt.orientalherbs.dao.catalog.CategoryRepository;
import com.httmdt.orientalherbs.dto.catalog.CategoryAdminRequestDto;
import com.httmdt.orientalherbs.dto.catalog.CategoryDto;
import com.httmdt.orientalherbs.mapper.catalog.CategoryMapper;
import com.httmdt.orientalherbs.model.catalog.Category;
import com.httmdt.orientalherbs.service.catalog.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(categoryMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: " + id));
        return categoryMapper.toDto(category);
    }

    @Override
    @Transactional
    public CategoryDto createCategory(CategoryAdminRequestDto requestDto) {
        // Validate: không trùng tên
        if (categoryRepository.existsByName(requestDto.getName())) {
            throw new RuntimeException("Danh mục với tên '" + requestDto.getName() + "' đã tồn tại");
        }

        Category category = categoryMapper.toEntity(requestDto);
        Category saved = categoryRepository.save(category);
        return categoryMapper.toDto(saved);
    }

    @Override
    @Transactional
    public CategoryDto updateCategory(Long id, CategoryAdminRequestDto requestDto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: " + id));

        // Validate: không trùng tên (trừ chính nó)
        if (categoryRepository.existsByNameAndIdNot(requestDto.getName(), id)) {
            throw new RuntimeException("Danh mục với tên '" + requestDto.getName() + "' đã tồn tại");
        }

        categoryMapper.updateEntity(category, requestDto);
        Category saved = categoryRepository.save(category);
        return categoryMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: " + id));

        // Validate: không cho xóa danh mục còn sản phẩm
        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            throw new RuntimeException("Không thể xóa danh mục đang có " + category.getProducts().size() + " sản phẩm");
        }

        categoryRepository.delete(category);
    }
}
