import { ProductSummary } from './catalog.type';

export type HomepageSectionType = 'CATEGORY' | 'TOP_SALES' | 'TOP_RATED' | 'NEW_ARRIVALS';

export interface HomepageSectionResponse {
  id: number;
  title: string;
  type: HomepageSectionType;
  referenceId: number | null;
  categoryName?: string;
  sortOrder: number;
  limitItems: number;
  isActive: boolean;
  products: ProductSummary[];
}
