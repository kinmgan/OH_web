// src/types/catalog/product.ts

export type HerbProperty = 'HAN' | 'NHIET' | 'ON' | 'LUONG' | 'BINH';
export type HerbFlavor = 'CHUA' | 'CAY' | 'MAN' | 'NGOT' | 'DANG' | 'NHAT';
export type Meridian = 'TAM' | 'CAN' | 'TY' | 'PHE' | 'THAN' | 'VI' | 'DOM' | 'DAI_TRANG' | 'TIEU_TRANG' | 'BANG_QUANG' | 'TAM_TIEU' | 'TAM_BAO';
export type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface ProductImage {
  id: number;
  productImageUrl: string;
  isDefault: boolean;
}

export interface ProductVariant {
  id: number;
  unitName: string;
  price: number;
  stockQuantity: number;
  // Pricing info từ campaign
  originalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  discountType?: DiscountType;
  discountValue?: number;
  campaignId?: number;
  campaignName?: string;
}

export interface ReviewImage {
  id?: number;
  imageUrl: string;
  imagePublicId?: string;
  displayOrder?: number;
}

export interface ProductReview {
  id: number;
  rating: number;
  comment: string;
  sentiment: Sentiment | null;
  keywords: string[] | null;
  reviewerName: string;
  createdAt: string;
  images: ReviewImage[];
}

export interface ProductDetail {
  id: number;
  name: string;
  sku: string;
  description: string;
  origin: string | null;
  soldQuantity: number;
  averageRating: number;
  categoryName: string;
  properties: HerbProperty[];
  flavors: HerbFlavor[];
  meridians: Meridian[];
  tags: string[];
  certificateImages?: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  reviews: ProductReview[];
}