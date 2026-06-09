export interface CampaignProductItem {
  id: number;
  productId: number;
  productName: string;
  productVariantId: number;
  unitName: string;
  originalPrice: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  discountAmount: number;
  finalPrice: number;
  displayOrder: number;
  imageUrl: string | null;
}

export interface WebCampaign {
  id: number;
  name: string;
  description: string;
  type: 'WEB';
  status: 'ACTIVE';
  startDate: string;
  endDate: string;
  items: CampaignProductItem[];
}
