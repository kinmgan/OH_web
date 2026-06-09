import { http } from '@/utils/http';
import { Customer, CustomerListResponse, CustomerUpdateRequest, PaginatedResponse, HealthRadarSummary, UserHealthTag } from '@/types/customer.type';

class CustomerAdminService {
  async getCustomers(page: number = 0, size: number = 10, keyword: string = ''): Promise<CustomerListResponse> {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    if (keyword.trim()) {
      query.set('keyword', keyword.trim());
    }

    const data = await http<PaginatedResponse<Customer>>(`/admin/customers?${query.toString()}`);
    return {
      items: data.content,
      totalPages: data.totalPages,
      totalElements: data.totalElements,
    };
  }

  async getCustomerById(id: number): Promise<Customer> {
    return await http<Customer>(`/admin/customers/${id}`);
  }

  async updateCustomer(id: number, payload: CustomerUpdateRequest): Promise<Customer> {
    return await http<Customer>(`/admin/customers/${id}`, {
      method: 'PUT',
      body: payload,
    });
  }

  async deleteCustomer(id: number): Promise<void> {
    await http<void>(`/admin/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async getHealthRadarSummary(): Promise<HealthRadarSummary> {
    return await http<HealthRadarSummary>('/admin/customers/health-radar');
  }

  async getUserHealthTags(userId: number): Promise<UserHealthTag[]> {
    return await http<UserHealthTag[]>(`/admin/customers/${userId}/health-tags`);
  }
}

export const customerAdminService = new CustomerAdminService();
