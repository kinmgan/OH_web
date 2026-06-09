export interface Customer {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface CustomerUpdateRequest {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface CustomerListResponse {
  items: Customer[];
  totalPages: number;
  totalElements: number;
}

export interface CategoryCount {
  category: string;
  categoryDisplayName: string;
  count: number;
}

export interface HealthRadarSummary {
  categories: CategoryCount[];
  totalTags: number;
}

export interface UserHealthTag {
  id: number;
  tagName: string;
  category: string | null;
  categoryDisplayName: string;
  status: string | null;
  statusDisplayName: string;
  notes: string | null;
  confidenceScore: number | null;
  detectedAt: string;
}
