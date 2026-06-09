export type ReturnReason = 'DAMAGED' | 'WRONG_ITEM' | 'NOT_SATISFIED' | 'OTHER';
export type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';

export interface ReturnItemRequest {
  orderItemId: number;
  quantity: number;
  conditionNoted?: string;
}

export interface ReturnRequestPayload {
  reason: ReturnReason;
  description?: string;
  evidenceImages?: string[];
  items: ReturnItemRequest[];
}

export interface ReturnItemResponse {
  returnItemId: number;
  orderItemId: number;
  productName: string;
  productImage?: string;
  variantInfo?: string;
  quantity: number;
  conditionNoted?: string;
}

export interface RefundInfo {
  refundId: number;
  amount: number;
  method: string;
  status: string;
}

export interface ReturnResponse {
  returnRequestId: number;
  orderId: number;
  orderCode: string;
  reason: ReturnReason;
  description?: string;
  evidenceImages?: string[];
  status: ReturnStatus;
  createdAt: string;
  items: ReturnItemResponse[];
  refundInfo?: RefundInfo;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
