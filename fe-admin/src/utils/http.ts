// src/utils/http.ts

// Client-side (trình duyệt): dùng NEXT_PUBLIC_API_URL (baked lúc build)
// Server-side (container Next.js): dùng INTERNAL_API_URL để gọi qua mạng Docker
const API_URL =
  typeof window === 'undefined'
    ? process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Định nghĩa các method HTTP
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: HttpMethod;
  body?: any;
  silent?: boolean;
}

export const http = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  let token = '';

  // 1. TỰ ĐỘNG LẤY TOKEN (Xử lý cho cả Server và Client)
  if (typeof window === 'undefined') {
    // Nếu code đang chạy trên Server (Server Components của Next.js)
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      token = cookieStore.get('adminToken')?.value || '';
    } catch (e) {
      console.warn('Cannot load cookies from next/headers', e);
    }
  } else {
    // Nếu code đang chạy trên Client — lấy từ localStorage
    token = localStorage.getItem('adminToken') || '';
  }

  console.log(`[HTTP Client] ${options.method || 'GET'} ${endpoint} | Token: ${token ? token.substring(0, 20) + '...' : 'MISSING'}`);

  // 2. TỰ ĐỘNG ĐÍNH KÈM HEADER & TOKEN
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  console.log(`[HTTP Client] ${options.method || 'GET'} ${endpoint} | Token: ${token ? token.substring(0, 20) + '...' : 'MISSING'}`);

  // 3. GỌI API ĐẾN SPRING BOOT
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  console.log(`[HTTP Client] Response: ${response.status} ${response.statusText} for ${options.method || 'GET'} ${endpoint}`);

  // 4. XỬ LÝ LỖI CHUNG (Global Error Handling)
  if (!response.ok) {
    if (!options.silent) {
      console.error(`[HTTP Client] Error calling API: ${options.method || 'GET'} ${API_URL}${endpoint}`);
      console.error(`[HTTP Client] Status: ${response.status} ${response.statusText}`);
    }

    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    // Đọc error message từ backend nếu có
    try {
      const errorData = await response.json();
      if (!options.silent) {
        console.error(`[HTTP Client] Backend Error Data:`, errorData);
      }
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error && typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    } catch (e) {
      if (!options.silent) {
        console.error(`[HTTP Client] Could not parse backend error body`);
      }
    }

    if (response.status === 401) {
      const isLoginApi = endpoint.includes('/auth/login');

      if (!options.silent) {
        if (isLoginApi) {
          console.error('[HTTP Client] Đăng nhập thất bại: Tài khoản hoặc mật khẩu không chính xác.');
        } else {
          console.error('[HTTP Client] Token hết hạn hoặc không hợp lệ. Cần đăng nhập lại!');
        }
      }
      
      if (!isLoginApi) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          if (window.location.pathname !== '/dang-nhap') {
            window.location.href = '/dang-nhap';
          }
        }
      }
    }

    // Ném lỗi ra để các module nghiệp vụ tự bắt (try-catch) nếu cần
    throw new Error(errorMessage);
  }

  // Nếu API Spring Boot trả về rỗng (VD: status 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};

/**
 * Gọi API với FormData (multipart/form-data) — dùng cho upload file.
 * Không tự set Content-Type, để browser tự thêm boundary.
 */
export const httpFormData = async <T>(endpoint: string, formData: FormData, method: HttpMethod = 'POST'): Promise<T> => {
  let token = '';

  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      token = cookieStore.get('adminToken')?.value || '';
    } catch (e) {
      console.warn('Cannot load cookies from next/headers', e);
    }
  } else {
    token = localStorage.getItem('adminToken') || '';
  }

  const headers = new Headers();
  // Không set Content-Type — để browser tự thêm multipart boundary
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: formData,
  });

  if (!response.ok) {
    console.error(`[HTTP Client] Error calling API: ${method} ${API_URL}${endpoint}`);
    console.error(`[HTTP Client] Status: ${response.status} ${response.statusText}`);
    
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      console.error(`[HTTP Client] Backend Error Data:`, errorData);
      if (errorData.message) errorMessage = errorData.message;
      else if (errorData.error && typeof errorData.error === 'string') errorMessage = errorData.error;
      else if (typeof errorData === 'string') errorMessage = errorData;
    } catch (e) {
      console.error(`[HTTP Client] Could not parse backend error body`);
    }
    
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};
