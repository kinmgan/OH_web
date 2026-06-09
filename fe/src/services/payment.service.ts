import { http } from '@/utils/http';
import { PaymentInitResponse, PaymentStatusResponse } from '@/types/payment.type';

export interface PaymentReturnResult {
  orderId: string;
  status: 'success' | 'failed';
  responseCode: string;
  transactionStatus: string;
}

export const paymentService = {
  initPayment: async (orderId: number, method: string): Promise<PaymentInitResponse> => {
    return await http<PaymentInitResponse>('/payment/init', {
      method: 'POST',
      body: { orderId, method },
    });
  },

  getStatus: async (orderId: number): Promise<PaymentStatusResponse> => {
    return await http<PaymentStatusResponse>(`/payment/${orderId}`);
  },

  verifyReturn: async (params: Record<string, string>): Promise<PaymentReturnResult> => {
    const queryString = new URLSearchParams(params).toString();
    return await http<PaymentReturnResult>(`/payment/vnpay/return?${queryString}`);
  },
};
