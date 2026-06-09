// fe/src/services/productdetail.service.ts
import { http } from '@/utils/http';
import { ProductDetail } from '@/types/productdetail.type';

export const ProductDetailService = {
  /**
   * Lấy thông tin chi tiết của một sản phẩm dựa vào ID
   */
  getProductDetail: async (id: number | string): Promise<ProductDetail> => {

    return await http<ProductDetail>(`/public/products/${id}`, {
      method: 'GET',
      // Nếu bạn muốn cache dữ liệu public này trong Next.js (ISR)
      next: { revalidate: 3600 } // Cache 1 tiếng
    });
  }
};