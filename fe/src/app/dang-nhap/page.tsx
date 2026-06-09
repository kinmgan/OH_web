'use client';
import { useState, useEffect } from 'react';
import { AuthService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // Lắng nghe Message từ cửa sổ Popup trả về
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Đảm bảo message đến từ chính website của mình (bảo mật)
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (data && data.type === 'OAUTH_SUCCESS') {
        if (data.error) {
          alert('Đăng nhập Google thất bại: ' + data.error);
        } else if (data.token) {
          // Lưu token
          document.cookie = `accessToken=${data.token}; path=/; max-age=86400; SameSite=Strict`;
          try {
            const user = await AuthService.getCurrentUser();
            localStorage.setItem('user', JSON.stringify({
              id: user.userId,
              email: user.email,
              fullName: user.fullName,
              role: user.role
            }));
            router.push('/');
          } catch (err) {
            console.error('Lỗi lấy thông tin user:', err);
            alert('Có lỗi xảy ra khi lấy thông tin người dùng.');
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  const handleGoogleLogin = () => {
    const url = AuthService.getGoogleAuthUrl();
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      url,
      'GoogleLoginPopup',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await AuthService.login({ email, password });

      // LƯU TOKEN VÀO COOKIE ĐỂ http.ts CÓ THỂ ĐỌC ĐƯỢC
      // Set thời gian sống của cookie (VD: 1 ngày = 86400 giây)
      document.cookie = `accessToken=${res.token}; path=/; max-age=86400; SameSite=Strict`;

      // Thông tin user (không nhạy cảm) có thể lưu tạm localStorage để hiển thị trên UI (Header, Avatar...)
      localStorage.setItem('user', JSON.stringify({
        id: res.id,
        email: res.email,
        fullName: res.fullName,
        role: res.role
      }));

      router.push('/'); // Chuyển về trang chủ
    } catch (error) {
      alert('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Cột ảnh trái */}
      <div className="hidden w-1/2 bg-cover lg:block" style={{ backgroundImage: "url('/theme_config/cover_home_1.jpg')" }}></div>

      {/* Cột form phải */}
      <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="w-full max-w-md p-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-800">Đăng nhập để khám phá</h2>
          <p className="mb-8 text-gray-500">Nhập vào thông tin của bạn</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="email"
              placeholder="Email"
              className="w-full border-b border-gray-300 py-2 focus:border-yellow-600 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              className="w-full border-b border-gray-300 py-2 focus:border-yellow-600 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between">
              <button type="submit" className="bg-[#b38032] px-8 py-3 text-white transition hover:bg-[#9c6f2a]">
                Đăng nhập
              </button>
              <Link href="/quen-mat-khau" className="text-sm text-[#b38032] hover:underline">Quên mật khẩu?</Link>
            </div>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Hoặc tiếp tục với</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded border border-gray-300 px-4 py-2 transition hover:bg-gray-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Đăng nhập bằng Google</span>
              </button>
            </div>

            <div className="mt-6 text-center text-sm">
              Chưa có tài khoản? <Link href="/dang-ki" className="font-semibold text-gray-800 underline">Đăng ký</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}