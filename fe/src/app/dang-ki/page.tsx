'use client';
import { useState } from 'react';
import { AuthService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AuthService.register({ fullName, email, password });
      alert('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
      router.push('/dang-nhap');
    } catch (error) {
      alert('Đăng ký thất bại. Email có thể đã được sử dụng!');
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-cover lg:block" style={{ backgroundImage: "url('/theme_config/cover_home_1.jpg')" }}></div>

      <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="w-full max-w-md p-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-800">Tạo tài khoản</h2>
          <p className="mb-8 text-gray-500">Nhập vào thông tin của bạn</p>

          <form onSubmit={handleRegister} className="space-y-6">
            <input
              type="text"
              placeholder="Tên"
              className="w-full border-b border-gray-300 py-2 focus:border-yellow-600 focus:outline-none"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
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

            <button type="submit" className="w-full bg-[#b38032] py-3 text-white transition hover:bg-[#9c6f2a]">
              Tạo tài khoản
            </button>

            <div className="mt-6 text-center text-sm">
              Bạn đã có tài khoản? <Link href="/dang-nhap" className="font-semibold text-gray-800 underline">Đăng nhập</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}