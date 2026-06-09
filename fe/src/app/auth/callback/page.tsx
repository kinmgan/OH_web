'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'OAUTH_SUCCESS', token, error }, window.location.origin);
      window.close();
      return;
    }

    if (error) {
      alert(`Lỗi đăng nhập: ${error}`);
      router.replace('/dang-nhap?error=' + error);
      return;
    }

    if (token) {
      document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Strict`;
      AuthService.getCurrentUser()
        .then(user => {
          localStorage.setItem('user', JSON.stringify({
            id: user.userId,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          }));
          router.replace('/');
        })
        .catch(err => {
          console.error('Lỗi khi lấy thông tin user', err);
          router.replace('/dang-nhap?error=fetch_failed');
        });
    } else {
      router.replace('/dang-nhap?error=missing_token');
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Đang xử lý đăng nhập...</h2>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-yellow-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Đang xử lý đăng nhập...</h2>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-yellow-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
