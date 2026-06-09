import { http } from '@/utils/http';
import { CartItemRequest, CartItemResponse } from '@/types/cart.type';

export const CartService = {
  /**
   * Lấy danh sách sản phẩm trong giỏ hàng của user đang đăng nhập
   */
  getCartItems: async (): Promise<CartItemResponse[]> => {
    // API backend lấy user_id từ token, nên FE không cần truyền user_id trên URL
    return await http<CartItemResponse[]>('/cart/items', {
      method: 'GET',
    });
  },

  /**
   * Thêm sản phẩm vào giỏ hàng (BE sẽ lo logic cộng dồn và check kho)
   */
  addToCart: async (data: CartItemRequest): Promise<CartItemResponse> => {
    const res = await http<CartItemResponse>('/cart/items', {
      method: 'POST',
      body: data,
    });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart_updated'));
    return res;
  },

  /**
   * Cập nhật số lượng của một item trong giỏ
   */
  updateQuantity: async (cartItemId: number, quantity: number): Promise<CartItemResponse> => {
    const res = await http<CartItemResponse>(`/cart/items/${cartItemId}`, {
      method: 'PUT',
      body: { quantity }, // Tùy thuộc cấu trúc BE bạn muốn nhận object hay query param
    });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart_updated'));
    return res;
  },

  /**
   * Xóa một sản phẩm khỏi giỏ
   */
  removeItem: async (cartItemId: number): Promise<void> => {
    await http<void>(`/cart/items/${cartItemId}`, {
      method: 'DELETE',
    });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart_updated'));
  },
  
  /**
   * Xóa toàn bộ giỏ hàng (Dùng sau khi thanh toán thành công)
   */
  clearCart: async (): Promise<void> => {
    await http<void>('/cart/clear', {
      method: 'DELETE',
    });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart_updated'));
  }
};