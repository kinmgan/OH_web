import { http } from '@/utils/http';
import { OrderListItem, OrderDetail, OrderStatus, PaginatedResponse } from '@/types/order.type';

// Response wrapper to preserve pagination info
export interface OrderListResponse {
  items: OrderListItem[];
  totalPages: number;
}

class OrderAdminService {
  /**
   * Get all orders with pagination
   */
  async getAllOrders(page: number = 0, size: number = 10): Promise<OrderListResponse> {
    try {
      const response = await http<PaginatedResponse<OrderListItem>>(`/admin/orders?page=${page}&size=${size}`);
      return {
        items: response.content,
        totalPages: response.totalPages,
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: OrderStatus, page: number = 0, size: number = 10): Promise<OrderListResponse> {
    try {
      const response = await http<PaginatedResponse<OrderListItem>>(`/admin/orders/status/${status}?page=${page}&size=${size}`);
      return {
        items: response.content,
        totalPages: response.totalPages,
      };
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  }

  /**
   * Get order detail
   */
  async getOrderDetail(orderId: number): Promise<OrderDetail> {
    try {
      const response = await http<OrderDetail>(`/admin/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error('Error fetching order detail:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<OrderDetail> {
    try {
      return await http<OrderDetail>(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status },
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Get shipment by order ID
   */
  async getShipment(orderId: number): Promise<any> {
    try {
      return await http<any>(`/admin/shipments/order/${orderId}`);
    } catch (error) {
      console.error('Error fetching shipment:', error);
      throw error;
    }
  }

  /**
   * Create shipment for order
   */
  async createShipment(orderId: number): Promise<any> {
    try {
      return await http<any>(`/admin/shipments/order/${orderId}/create`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  }
}

export const orderAdminService = new OrderAdminService();

