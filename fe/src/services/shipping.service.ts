import { http } from '@/utils/http';
import { ShippingEstimate, ShippingFeeRequest } from '@/types/shipping.type';

export const shippingService = {
  estimateShipping: (addressId: number, items: { productVariantId: number; quantity: number }[]) => {
    const request: ShippingFeeRequest = { addressId, items };
    return http<ShippingEstimate[]>('/shipping/estimate', { method: 'POST', body: request });
  }
};
