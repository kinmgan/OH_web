// src/utils/http.ts

// Client-side (trình duyệt): dùng NEXT_PUBLIC_API_URL (baked lúc build)
// Server-side (container Next.js): dùng INTERNAL_API_URL để gọi qua mạng Docker
const API_URL =
  typeof window === 'undefined'
    ? process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL;

// Định nghĩa các method HTTP
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions extends RequestInit {
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
      token = cookieStore.get('accessToken')?.value || '';
    } catch (e) {
      console.warn('Cannot load cookies from next/headers', e);
    }
  } else {
    // Nếu code đang chạy trên Client (Trình duyệt)
    // Tạm thời lấy bằng regex từ document.cookie
    const match = document.cookie.match(/(^|;)\s*accessToken\s*=\s*([^;]+)/);
    token = match ? match[2] : '';
  }

  // 2. TỰ ĐỘNG ĐÍNH KÈM HEADER & TOKEN
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 3. GỌI API ĐẾN SPRING BOOT
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // 4. XỬ LÝ LỖI CHUNG (Global Error Handling)
  if (!response.ok) {
    if (!options.silent) {
      console.error(`[HTTP Client] Error calling API: ${options.method || 'GET'} ${API_URL}${endpoint}`);
      console.error(`[HTTP Client] Status: ${response.status} ${response.statusText}`);

      // Đọc error message từ backend nếu có
      try {
        const errorData = await response.json();
        console.error(`[HTTP Client] Backend Error Data:`, errorData);
      } catch (e) {
        console.error(`[HTTP Client] Could not parse backend error body`);
      }
    }

    if (response.status === 401) {
      // Kiểm tra xem có phải đang ở endpoint đăng nhập không
      const isLoginApi = endpoint.includes('/auth/login');

      if (!options.silent) {
        if (isLoginApi) {
          console.error('[HTTP Client] Đăng nhập thất bại: Tài khoản hoặc mật khẩu không chính xác.');
        } else {
          console.error('[HTTP Client] Token hết hạn hoặc không hợp lệ. Cần đăng nhập lại!');
        }
      }
      
      // Redirect về /dang-nhap nếu không phải đang ở đó
      if (typeof window !== 'undefined' && window.location.pathname !== '/dang-nhap') {
        // window.location.href = '/dang-nhap'; 
      }
    }

    // Ném lỗi ra để các module nghiệp vụ tự bắt (try-catch) nếu cần
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // Nếu API Spring Boot trả về rỗng (VD: status 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};