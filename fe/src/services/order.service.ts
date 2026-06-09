// fe/src/services/order.service.ts
import { http } from '@/utils/http';
import { OrderRequest, OrderResponse, OrderListItem, OrderDetail, OrderStatus } from '@/types/order.type';

// Response wrapper to preserve pagination info
export interface OrderListResponse {
  items: OrderListItem[];
  totalPages: number;
}

export const orderService = {
  // Create order
  createOrder: async (data: OrderRequest): Promise<OrderResponse> => {
    return await http<OrderResponse>('/orders', {
      method: 'POST',
      body: data,
    });
  },

  // Get user's orders with pagination
  getMyOrders: async (page: number = 0, size: number = 10): Promise<OrderListResponse> => {
    const response = await http<any>(`/orders?page=${page}&size=${size}`, {
      method: 'GET',
    });
    return {
      items: response.content || [],
      totalPages: response.totalPages || 0,
    };
  },

  // Get user's orders by status
  getMyOrdersByStatus: async (status: OrderStatus, page: number = 0, size: number = 10): Promise<OrderListResponse> => {
    const response = await http<any>(`/orders/status/${status}?page=${page}&size=${size}`, {
      method: 'GET',
    });
    return {
      items: response.content || [],
      totalPages: response.totalPages || 0,
    };
  },

  // Get order detail
  getOrderDetail: async (orderId: number): Promise<OrderDetail> => {
    return await http<OrderDetail>(`/orders/${orderId}`, {
      method: 'GET',
    });
  },

  // Cancel order
  cancelOrder: async (orderId: number): Promise<OrderDetail> => {
    return await http<OrderDetail>(`/orders/${orderId}/cancel`, {
      method: 'PUT',
    });
  },
};

