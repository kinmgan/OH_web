import { PaymentMethod } from './order.type';

export interface PaymentInitResponse {
  paymentUrl: string;
  orderId: number;
  expiredAt: string;
  method: PaymentMethod;
  message?: string;
}

export interface PaymentStatusResponse {
  orderId: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  message?: string;
}
