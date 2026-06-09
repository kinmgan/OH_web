// Định nghĩa kiểu dữ liệu khớp chính xác với DTO từ Spring Boot
export interface CartItemResponse {
  cartItemId: number;
  productVariantId: number;
  productName: string;
  unitName: string;
  imageUrl: string;
  price: number;
  quantity: number;
  totalPrice: number;
  stockQuantity: number; // Dùng để disable nút '+' trên UI nếu quantity >= stockQuantity
  // Pricing info từ campaign
  originalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  campaignId?: number;
  campaignName?: string;
}

export interface CartItemRequest {
  productVariantId: number;
  quantity: number;
}