import { http, httpFormData } from '@/utils/http';
import { ReturnResponse, PaginatedResponse, RefundRequest, ReturnStatus } from '@/types/return.type';

export const returnService = {
  getAll: async (
    page: number = 0,
    size: number = 10,
    status?: ReturnStatus
  ): Promise<{ items: ReturnResponse[]; totalPages: number }> => {
    let url = `/admin/returns?page=${page}&size=${size}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await http<PaginatedResponse<ReturnResponse>>(url);
    return {
      items: response.content || [],
      totalPages: response.totalPages || 0,
    };
  },

  getByStatus: async (status: ReturnStatus, page: number = 0, size: number = 10): Promise<{ items: ReturnResponse[]; totalPages: number }> => {
    const response = await http<PaginatedResponse<ReturnResponse>>(`/admin/returns/status/${status}?page=${page}&size=${size}`);
    return {
      items: response.content || [],
      totalPages: response.totalPages || 0,
    };
  },

  getDetail: async (returnId: number): Promise<ReturnResponse> => {
    return await http<ReturnResponse>(`/admin/returns/${returnId}`);
  },

  approve: async (returnId: number): Promise<ReturnResponse> => {
    return await http<ReturnResponse>(`/admin/returns/${returnId}/approve`, {
      method: 'PUT',
    });
  },

  reject: async (returnId: number): Promise<ReturnResponse> => {
    return await http<ReturnResponse>(`/admin/returns/${returnId}/reject`, {
      method: 'PUT',
    });
  },

  confirmReceived: async (returnId: number): Promise<ReturnResponse> => {
    return await http<ReturnResponse>(`/admin/returns/${returnId}/received`, {
      method: 'PUT',
    });
  },

  processRefund: async (returnId: number, data: RefundRequest): Promise<ReturnResponse> => {
    const formData = new FormData();
    const requestData = { amount: data.amount, method: data.method };
    formData.append('data', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));
    if (data.proofImage) {
      formData.append('proofImage', data.proofImage);
    }
    return await httpFormData<ReturnResponse>(`/admin/returns/${returnId}/refund`, formData, 'POST');
  },
};
