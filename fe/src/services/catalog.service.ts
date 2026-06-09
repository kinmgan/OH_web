// src/services/catalog.service.ts
import { ProductSummary, PageResponse, GetProductsParams } from '@/types/catalog.type';

// Trỏ tới URL BE Spring Boot của bạn
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const CatalogService = {
  /**
   * Lấy danh sách sản phẩm public (có phân trang, sắp xếp, lọc theo danh mục)
   */
  getProducts: async (params: GetProductsParams): Promise<PageResponse<ProductSummary>> => {
    const queryParams = new URLSearchParams();

    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDir) queryParams.append('sortDir', params.sortDir);

    const endpoint = `${API_URL}/public/products?${queryParams.toString()}`;

    // Dùng fetch thuần của trình duyệt để không dính dáng đến next/headers
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Nếu API trả về cache quá cứng, bạn có thể thêm:
      // cache: 'no-store' 
    });

    if (!response.ok) {
      console.error(`[CatalogService] Error calling GET ${endpoint}`);
      console.error(`[CatalogService] Status: ${response.status} ${response.statusText}`);
      try {
        const errorData = await response.json();
        console.error(`[CatalogService] Backend Error Data:`, errorData);
      } catch (e) {
        // Ignore JSON parse error if body is empty
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
};