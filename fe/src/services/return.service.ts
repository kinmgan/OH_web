import { http } from '@/utils/http';
import { ReturnRequestPayload, ReturnResponse, PaginatedResponse } from '@/types/return.type';

export const returnService = {
  createReturn: async (orderId: number, data: ReturnRequestPayload): Promise<ReturnResponse> => {
    return await http<ReturnResponse>(`/orders/${orderId}/return`, {
      method: 'POST',
      body: data,
    });
  },

  getReturnByOrder: async (orderId: number): Promise<ReturnResponse> => {
    return await http<ReturnResponse>(`/orders/${orderId}/return`, {
      method: 'GET',
    });
  },

  getMyReturns: async (page: number = 0, size: number = 10): Promise<{ items: ReturnResponse[]; totalPages: number }> => {
    const response = await http<PaginatedResponse<ReturnResponse>>(`/orders/my-returns?page=${page}&size=${size}`);
    return {
      items: response.content || [],
      totalPages: response.totalPages || 0,
    };
  },

  uploadReturnImage: async (file: File): Promise<{ url: string; public_id: string }> => {
    let token = '';
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/(^|;)\s*accessToken\s*=\s*([^;]+)/);
      token = match ? match[2] : '';
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'return_evidence');

    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    
    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },
};
