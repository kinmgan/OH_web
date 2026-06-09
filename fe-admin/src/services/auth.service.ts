import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  id: number;
  email: string;
  fullName: string;
  role: string; // e.g., 'ROLE_ADMIN'
}

class AuthService {
  private localStorageKey = 'adminToken';
  private userKey = 'adminUser';



  async login(credentials: LoginRequest): Promise<JwtResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    const data: JwtResponse = response.data;
    
    if (!data.role?.includes('ADMIN')) {
      throw new Error('Tài khoản này không có quyền quản trị');
    }
    
    // Store token and user info in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.localStorageKey, data.token);
      localStorage.setItem(this.userKey, JSON.stringify(data));
    }
    // In Next.js with app router, setting cookies from client for middleware is tricky without API.
    // If we rely on middleware, we could use document.cookie directly here.
    if (typeof document !== 'undefined') {
      document.cookie = `adminToken=${data.token}; path=/; max-age=86400; SameSite=Lax`;
    }
    
    return data;
  }

  async register(data: RegisterRequest): Promise<any> {
    return await axios.post(`${API_BASE_URL}/auth/register`, data);
  }

  logout(): void {
    localStorage.removeItem(this.localStorageKey);
    localStorage.removeItem(this.userKey);
    // Clear cookie
    if (typeof document !== 'undefined') {
      document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.localStorageKey);
  }

  getUser(): JwtResponse | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasAdminRole(): boolean {
    const user = this.getUser();
    return !!user?.role?.includes('ADMIN');
  }
}

export const authService = new AuthService();
