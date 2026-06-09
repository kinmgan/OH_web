'use client';
import { useState } from 'react';
import { AuthService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await AuthService.forgotPassword(email);
      setMessage(res.message || 'Mã OTP đã được gửi đến email của bạn.');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await AuthService.resetPassword({ email, otpCode, newPassword });
      alert(res.message || 'Mật khẩu đã được đặt lại thành công.');
      router.push('/dang-nhap');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng kiểm tra lại OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-cover lg:block" style={{ backgroundImage: "url('/theme_config/cover_home_1.jpg')" }}></div>

      <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="w-full max-w-md p-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-800">Quên mật khẩu</h2>
          
          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
          {message && <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">{message}</div>}

          {step === 1 ? (
            <>
              <p className="mb-8 text-gray-500">Nhập email của bạn để nhận mã OTP khôi phục</p>
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="w-full border-b border-gray-300 py-2 focus:border-yellow-600 focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#b38032] px-8 py-3 text-white transition hover:bg-[#9c6f2a] disabled:opacity-50"
                >
                  {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                </button>
                
                <div className="mt-6 text-center text-sm">
                  Nhớ mật khẩu? <Link href="/dang-nhap" className="font-semibold text-gray-800 underline">Đăng nhập</Link>
                </div>
              </form>
            </>
          ) : (
            <>
              <p className="mb-8 text-gray-500">Nhập mã OTP đã được gửi đến email <strong>{email}</strong></p>
              <form onSubmit={handleResetPassword} className="space-y-6">
                <input
                  type="text"
                  placeholder="Mã OTP (6 chữ số)"
                  className="w-full border-b border-gray-300 py-2 focus:border-yellow-600 focus:outline-none"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  maxLength={6}
                />
                <input
                  type="password"
                  placeholder="Mật khẩu mới"
                  className="w-full border-b border-gray-300 py-2 focus:border-yellow-600 focus:outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#b38032] px-8 py-3 text-white transition hover:bg-[#9c6f2a] disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận đặt lại'}
                </button>
                
                <div className="mt-6 text-center text-sm">
                  <button type="button" onClick={() => setStep(1)} className="text-[#b38032] hover:underline">
                    Quay lại nhập email
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
