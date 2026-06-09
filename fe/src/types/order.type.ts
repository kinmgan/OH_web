// fe/src/types/order.type.ts

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'MOMO' | 'VNPAY';
export type ShippingCarrier = 'GHN' | 'GHTK' | 'VNPOST';
export type ShipmentStatus = 'PENDING' | 'CREATED' | 'PICKING_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';

export interface OrderItemRequest {
  productVariantId: number;
  quantity: number;
}

export interface OrderRequest {
  addressId: number;
  paymentMethod: string;
  couponId?: number;
  items: OrderItemRequest[];
  shippingCarrier?: ShippingCarrier;
}

export interface OrderResponse {
  orderId: number;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
  paymentMethod: string;
}

// For order list and detail
export interface OrderListItem {
  orderId: number;
  orderCode: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  itemCount: number;
}

export interface TrackingHistoryEntry {
  statusDescription: string;
  location: string;
  updatedAt: string;
}

export interface OrderItemDetail {
  itemId: number;
  productVariantId: number;
  productId: number;
  productName: string;
  productImage: string;
  variantInfo: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShipmentDetail {
  shipmentId: number;
  carrierCode?: string;
  carrierName: string;
  carrierOrderId?: string;
  trackingNumber: string;
  shipmentStatus?: ShipmentStatus;
  shippingFee?: number;
  codAmount?: number;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  trackingHistories?: TrackingHistoryEntry[];
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
  evidenceImages?: string[];
}

export interface RefundDetail {
  refundId: number;
  refundAmount: number;
  status: string;
  refundedAt?: string;
  reason: string;
  proofImage?: string;
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

