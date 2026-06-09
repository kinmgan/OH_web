export interface DashboardStats {
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  newCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  processingOrders: number;
  shippingOrders: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface ReviewSentiment {
  name: string;
  value: number;
}

export interface WordCloudItem {
  text: string;
  value: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'MOMO' | 'VNPAY';

export interface RecentOrder {
  orderId: number;
  orderCode: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  itemCount: number;
}
