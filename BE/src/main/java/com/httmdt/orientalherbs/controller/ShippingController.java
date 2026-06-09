package com.httmdt.orientalherbs.controller;

import com.httmdt.orientalherbs.dto.shipping.ShippingFeeRequest;
import com.httmdt.orientalherbs.dto.shipping.ShippingFeeResponse;
import com.httmdt.orientalherbs.service.shipping.ShippingEstimateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/shipping")
@RequiredArgsConstructor
public class ShippingController {

    private final ShippingEstimateService shippingEstimateService;

    @PostMapping("/estimate")
    public ResponseEntity<List<ShippingFeeResponse>> estimateShipping(
            @Valid @RequestBody ShippingFeeRequest request) {
        List<ShippingFeeResponse> estimates = shippingEstimateService.estimateShipping(
                request.getAddressId(), request.getItems()
        );
        return ResponseEntity.ok(estimates);
    }
}
