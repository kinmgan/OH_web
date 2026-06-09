'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AccountBreadcrumb() {
  const pathname = usePathname();

  const getPageName = () => {
    if (pathname.includes('/ho-so')) return 'Hồ sơ';
    if (pathname.includes('/dia-chi')) return 'Địa chỉ';
    if (pathname.includes('/don-hang')) return 'Đơn hàng';
    return '';
  };

  return (
    <div className="text-[20px] mb-12 mt-4 text-[#666666]">
      <Link href="/" className="hover:text-[#A57322]">Trang chủ</Link>
      <span className="mx-1">/</span>
      <span className="hover:text-[#A57322] cursor-pointer"> Tài khoản</span>
      <span className="mx-1">/</span>
      <span> {getPageName()}</span>
    </div>
  );
}
