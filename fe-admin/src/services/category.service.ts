import { http } from '@/utils/http';
import { Category, CategoryRequest } from '@/types/category.type';

class CategoryAdminService {
  async getAllCategories(): Promise<Category[]> {
    return await http<Category[]>('/admin/categories');
  }

  async getCategoryById(id: number): Promise<Category> {
    return await http<Category>(`/admin/categories/${id}`);
  }

  async createCategory(data: CategoryRequest): Promise<Category> {
    return await http<Category>('/admin/categories', {
      method: 'POST',
      body: data,
    });
  }

  async updateCategory(id: number, data: CategoryRequest): Promise<Category> {
    return await http<Category>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteCategory(id: number): Promise<void> {
    await http<void>(`/admin/categories/${id}`, { method: 'DELETE' });
  }
}

export const categoryAdminService = new CategoryAdminService();
