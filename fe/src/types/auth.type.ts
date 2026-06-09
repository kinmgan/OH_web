// fe/src/types/auth.type.ts

export interface LoginRequest {
  email: string;
  password?: string; // Tùy chọn nếu bạn tích hợp đăng nhập không mật khẩu sau này
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  email: string;
  fullName: string;
  role: string;
}