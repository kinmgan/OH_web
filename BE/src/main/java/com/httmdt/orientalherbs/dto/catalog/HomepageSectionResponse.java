package com.httmdt.orientalherbs.dto.catalog;

import java.util.List;

import com.httmdt.orientalherbs.model.enums.HomepageSectionType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HomepageSectionResponse {
    private Long id;
    private String title;
    private HomepageSectionType type;
    private Long referenceId;
    private String categoryName;
    private Integer sortOrder;
    private Integer limitItems;
    private Boolean isActive;
    private List<ProductSummaryDto> products;
}
