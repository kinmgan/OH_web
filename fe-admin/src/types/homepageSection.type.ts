export type HomepageSectionType = 'CATEGORY' | 'TOP_SALES' | 'TOP_RATED' | 'NEW_ARRIVALS';

export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  campaignId?: number;
  rate: number;
  soldQuantity: number;
  imageUrl: string;
}

export interface HomepageSection {
  id: number;
  title: string;
  type: HomepageSectionType;
  referenceId: number | null;
  categoryName?: string;
  sortOrder: number;
  limitItems: number;
  isActive: boolean;
  products?: ProductSummary[];
}

export interface HomepageSectionRequest {
  title: string;
  type: HomepageSectionType;
  referenceId?: number | null;
  sortOrder: number;
  limitItems?: number;
  isActive?: boolean;
}
