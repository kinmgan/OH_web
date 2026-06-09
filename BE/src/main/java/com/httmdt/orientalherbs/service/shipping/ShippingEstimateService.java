package com.httmdt.orientalherbs.service.shipping;

import com.httmdt.orientalherbs.dto.shipping.ShippingFeeRequest;
import com.httmdt.orientalherbs.dto.shipping.ShippingFeeResponse;

import java.util.List;

public interface ShippingEstimateService {
    List<ShippingFeeResponse> estimateShipping(Long addressId, List<ShippingFeeRequest.CartItemRequest> items);
}
