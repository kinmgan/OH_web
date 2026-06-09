package com.httmdt.orientalherbs.dto.common;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PageResponseDto<T> {
    private List<T> content;
    private int pageNo;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean last;
}