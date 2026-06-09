import { http } from '@/utils/http';
import { Category } from '@/types/catalog/category.type';

export const CategoryService = {
  /**
   * Fetch all categories from the public API
   */
  getAllCategories: async (): Promise<Category[]> => {
    return await http<Category[]>('/public/categories', {
      method: 'GET',
      next: { revalidate: 3600 } 
    });
  }
};
