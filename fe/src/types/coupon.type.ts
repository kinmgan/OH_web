// fe/src/types/coupon.type.ts

export interface CouponResponse {
  id: number;
  code: string;
  description: string;
  discountPercent?: number;
  amountDiscount?: number;
  maxDiscountAmount?: number;
  minOrderValue: number;
  expiryDate: string;
  couponType: string;
}
