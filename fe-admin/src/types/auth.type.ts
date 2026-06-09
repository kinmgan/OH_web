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
