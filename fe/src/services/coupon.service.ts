// fe/src/services/coupon.service.ts
import { http } from '@/utils/http';
import { CouponResponse } from '@/types/coupon.type';

export const couponService = {
  getAvailableCoupons: async (orderValue: number): Promise<CouponResponse[]> => {
    return await http<CouponResponse[]>(`/coupons/available?orderValue=${orderValue}`, {
      method: 'GET',
    });
  }
};
