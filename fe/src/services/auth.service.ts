// fe/src/services/auth.service.ts
import { http } from '@/utils/http';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth.type';

export const AuthService = {

  login: async (params: LoginRequest): Promise<AuthResponse> => {
    // Lưu ý: Đảm bảo endpoint này khớp với cấu hình API_URL và Backend của bạn
    // Ví dụ API_URL = 'http://localhost:8080/api', thì endpoint là '/auth/login'
    return await http<AuthResponse>('/auth/login', {
      method: 'POST',
      body: params,
    });
  },

  /**
   * Đăng ký tài khoản mới
   */
  register: async (params: RegisterRequest): Promise<any> => {
    return await http<any>('/auth/register', {
      method: 'POST',
      body: params,
    });
  },

  getGoogleAuthUrl: (): string => {
    // Gọi thẳng backend để redirect qua Google
    return `http://localhost:8080/api/v1/oauth2/authorization/google`;
  },

  getCurrentUser: async (): Promise<any> => {
    return await http<any>('/auth/me', {
      method: 'GET',
    });
  },

  forgotPassword: async (email: string): Promise<any> => {
    return await http<any>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  },

  resetPassword: async (params: { email: string; otpCode: string; newPassword: string }): Promise<any> => {
    return await http<any>('/auth/reset-password', {
      method: 'POST',
      body: params,
    });
  }
};