// Campaign Types for Admin

export type CampaignType = 'WEB' | 'EMAIL';
// PAUSED bị xóa vì không có ý nghĩa thực tế
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface CampaignProductVariantItem {
  id?: number;
  productVariantId: number;
  productId?: number;
  productName?: string;
  unitName?: string;
  originalPrice?: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount?: number;
  finalPrice?: number;
  displayOrder?: number;
}

export interface CampaignListItem {
  id: number;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  scheduledAt?: string;
  itemCount: number;
  displayOrder?: number;
  totalSent?: number; // Chỉ có với EMAIL campaign
}

export interface CampaignDetail extends CampaignListItem {
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  items: CampaignProductVariantItem[];
  targetHealthCategory?: string; // giá trị enum HealthCategory: HO_HAP, TIEU_HOA,...
  templateId?: number;
  totalSent?: number;
}

export interface CampaignCreateRequest {
  name: string;
  description?: string;
  type: CampaignType;
  startDate?: string | null;
  endDate?: string | null;
  scheduledAt?: string | null;
  displayOrder?: number;
  items?: {
    productVariantId: number;
    discountType: DiscountType;
    discountValue: number;
    displayOrder?: number;
  }[];
  targetHealthCategory?: string;
  templateId?: number | null;
}

export interface CampaignUpdateRequest extends CampaignCreateRequest {
  status?: CampaignStatus;
}

export interface CampaignStatusUpdateRequest {
  status: CampaignStatus;
}

// Paginated response type
export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// Helper functions
export const getCampaignStatusLabel = (status: CampaignStatus): string => {
  const labels: Record<CampaignStatus, string> = {
    DRAFT: 'Bản nháp',
    SCHEDULED: 'Đã lên lịch',
    ACTIVE: 'Đang hoạt động',
    COMPLETED: 'Đã kết thúc',
    CANCELLED: 'Đã hủy',
  };
  return labels[status] || status;
};

export const getCampaignTypeLabel = (type: CampaignType): string => {
  const labels: Record<CampaignType, string> = {
    WEB: 'Web',
    EMAIL: 'Email',
  };
  return labels[type] || type;
};

export const getDiscountTypeLabel = (type: DiscountType): string => {
  const labels: Record<DiscountType, string> = {
    PERCENTAGE: 'Phần trăm',
    FIXED_AMOUNT: 'Số tiền cố định',
  };
  return labels[type] || type;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Các danh mục sức khỏe – tương ứng với enum HealthCategory ở BE
export const HEALTH_TAG_OPTIONS = [
  { value: '', label: 'Tất cả khách hàng' },
  { value: 'HO_HAP', label: 'Hệ Hô hấp' },
  { value: 'TIEU_HOA', label: 'Hệ Tiêu hóa' },
  { value: 'THAN_KINH', label: 'Hệ Thần kinh' },
  { value: 'CO_XUONG_KHOP', label: 'Hệ Cơ xương khớp' },
  { value: 'TIM_MACH', label: 'Hệ Tim mạch' },
  { value: 'DA_LIEU', label: 'Hệ Da liễu' },
  { value: 'KHAC', label: 'Khác' },
];
