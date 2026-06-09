export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  rate: number;
  soldQuantity: number;
  imageUrl: string | null;
  // Pricing info từ campaign
  originalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  campaignId?: number;
  campaignName?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface GetProductsParams {
  categoryId?: number;
  keyword?: string;
  page?: number;
  size?: number;
  sortBy?: 'price' | 'name' | 'soldquantity' | 'rate';
  sortDir?: 'asc' | 'desc';
}