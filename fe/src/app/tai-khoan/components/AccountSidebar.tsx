'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AccountSidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Hồ sơ', href: '/tai-khoan/ho-so' },
    { name: 'Địa chỉ', href: '/tai-khoan/dia-chi' },
    { name: 'Đơn hàng', href: '/tai-khoan/don-hang' },

  ];

  return (
    <nav className="flex flex-col gap-6">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`font-semibold text-[16px] transition-colors ${
              isActive ? 'text-[#A57322]' : 'text-[#1A1A1A] hover:text-[#A57322]'
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
