package com.httmdt.orientalherbs.service.pricing;

import java.util.List;
import java.util.Map;

import com.httmdt.orientalherbs.dto.pricing.PriceQuote;

public interface PricingService {

    PriceQuote quote(Long productVariantId);

    Map<Long, PriceQuote> quoteBatch(List<Long> productVariantIds);
}
