package com.httmdt.orientalherbs.dto.shipping;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShippingFeeResponse {
    private String carrier;
    private String carrierName;
    private BigDecimal fee;
    private Integer estimatedDays;
    private String serviceLabel;
}
