package com.httmdt.orientalherbs.dto.marketing_and_campaign;

import java.math.BigDecimal;

import com.httmdt.orientalherbs.model.enums.DiscountType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CampaignProductVariantRequest {

    @NotNull(message = "Product variant ID is required")
    private Long productVariantId;

    @NotNull(message = "Discount type is required")
    private DiscountType discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.01", message = "Discount value must be greater than 0")
    private BigDecimal discountValue;

    @Min(value = 0, message = "Display order must be >= 0")
    private Integer displayOrder = 0;
}
