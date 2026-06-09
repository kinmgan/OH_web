package com.httmdt.orientalherbs.dto.catalog;

import com.httmdt.orientalherbs.model.enums.HomepageSectionType;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HomepageSectionRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề không quá 255 ký tự")
    private String title;

    @NotNull(message = "Loại khối không được để trống")
    private HomepageSectionType type;

    private Long referenceId;

    @NotNull(message = "Thứ tự sắp xếp không được để trống")
    private Integer sortOrder;

    @Min(value = 1, message = "Số lượng sản phẩm tối thiểu là 1")
    private Integer limitItems = 10;

    private Boolean isActive = true;
}
