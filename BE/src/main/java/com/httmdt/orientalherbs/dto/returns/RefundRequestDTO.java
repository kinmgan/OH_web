package com.httmdt.orientalherbs.dto.returns;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class RefundRequestDTO {
    private BigDecimal amount;
    private String method;
}
