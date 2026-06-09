export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'MOMO' | 'VNPAY';

export interface OrderListItem {
  orderId: number;
  orderCode: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  itemCount: number;
}

export interface OrderItemDetail {
  itemId: number;
  productVariantId: number;
  productName: string;
  productImage: string;
  variantInfo: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShipmentDetail {
  shipmentId: number;
  carrierName: string;
  trackingNumber: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
}

export interface PaymentDetail {
  paymentId: number;
  status: string;
  paidAt?: string;
}

export interface ReturnDetail {
  returnRequestId: number;
  reason: string;
  status: string;
  createdAt: string;
}

export interface RefundDetail {
  refundId: number;
  refundAmount: number;
  status: string;
  refundedAt?: string;
  reason: string;
}

export interface OrderDetail {
  orderId: number;
  orderCode: string;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  subtotal: number;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  
  addressId: number;
  recipientName: string;
  recipientPhone: string;
  addressDetail: string;
  
  couponId?: number;
  couponCode?: string;
  
  items: OrderItemDetail[];
  shipment?: ShipmentDetail;
  payment?: PaymentDetail;
  returnInfo?: ReturnDetail;
  refundInfo?: RefundDetail;
}

// Response types for API calls
export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
}

export interface OrderListResponse extends PaginatedResponse<OrderListItem> {}

export interface OrderListResponseData {
  data: OrderListItem[];
  page: number;
  totalPages: number;
}
