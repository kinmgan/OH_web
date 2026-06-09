import { http, httpFormData } from '@/utils/http';
import { Product, ProductRequest } from '@/types/product.type';
import { PaginatedResponse } from '@/types/order.type';

class ProductAdminService {
  async getAllProducts(page: number = 0, size: number = 10, keyword: string = ''): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (keyword) params.append('keyword', keyword);

    return await http<PaginatedResponse<Product>>(`/admin/products?${params.toString()}`);
  }

  async getProductById(id: number): Promise<Product> {
    return await http<Product>(`/admin/products/${id}`);
  }

  async createProduct(productData: ProductRequest, images: File[], certificates: File[] = []): Promise<Product> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(productData));

    images.forEach(img => {
      formData.append('images', img);
    });

    certificates.forEach(cert => {
      formData.append('certificates', cert);
    });

    return await httpFormData<Product>('/admin/products', formData, 'POST');
  }

  async updateProduct(id: number, productData: ProductRequest, images: File[], certificates: File[] = []): Promise<Product> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(productData));

    images.forEach(img => {
      formData.append('images', img);
    });

    certificates.forEach(cert => {
      formData.append('certificates', cert);
    });

    return await httpFormData<Product>(`/admin/products/${id}`, formData, 'PUT');
  }

  async deleteProduct(id: number): Promise<void> {
    await http<void>(`/admin/products/${id}`, { method: 'DELETE' });
  }
}

export const productAdminService = new ProductAdminService();
