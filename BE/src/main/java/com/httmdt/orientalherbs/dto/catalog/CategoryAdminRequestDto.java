package com.httmdt.orientalherbs.dto.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryAdminRequestDto {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 100, message = "Tên danh mục không quá 100 ký tự")
    private String name;

    private String description;

    @Size(max = 50, message = "Mã danh mục không quá 50 ký tự")
    private String cateCode;

    private Integer displayOrder;
}
