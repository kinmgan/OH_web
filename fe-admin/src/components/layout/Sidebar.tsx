'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, LayoutDashboard, ShoppingCart, FolderOpen, Package, Users, Zap, Image as ImageIcon, CornerUpLeft, Layout, MessageSquare, FileText, Mail, Info, Shield } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { label: 'Tổng quan', href: '/', icon: LayoutDashboard },
  { label: 'Đơn hàng', href: '/don-hang', icon: ShoppingCart },
  { label: 'Hoàn hàng', href: '/hoan-hang', icon: CornerUpLeft },
  { label: 'Danh mục', href: '/danh-muc', icon: FolderOpen },
  { label: 'Sản phẩm', href: '/san-pham', icon: Package },
  { label: 'Khách hàng', href: '/khach-hang', icon: Users },
  { label: 'Khuyến mãi & Chiến dịch', href: '/chien-dich', icon: Zap },
  { label: 'Mẫu Email', href: '/email-templates', icon: Mail },
  { label: 'Giao diện Web', href: '/appearance', icon: ImageIcon },
  { label: 'Bố cục trang chủ', href: '/homepage-layout', icon: Layout },
  { label: 'Về chúng tôi', href: '/trang-tinh/about', icon: Info },
  { label: 'Chính sách', href: '/trang-tinh/chinh-sach', icon: Shield },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  return (
    <>
      {/* Sidebar */}
      <div style={{
        width: isOpen ? '260px' : '80px',
        background: '#A57322',
        color: '#fff',
        padding: '20px',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
      }}>
        {/* Logo Area */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          height: '50px'
        }}>
          {isOpen && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '18px',
              fontWeight: 700
            }}>
              <img
                src="/images/logo.png"
                alt="Oriental Herbs Logo"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '4px',
                  objectFit: 'contain',
                  background: 'rgba(255,255,255,0.2)'
                }}
              />
              <span>Quản lý</span>
            </div>
          )}
          <button
            onClick={onToggle}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'transparent',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }
                }}
              >
                <Icon size={20} style={{ minWidth: '20px' }} />
                {isOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {isOpen && (
          <div style={{
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center'
          }}>
            <div>Oriental Herbs Admin</div>
            <div>v0.1.0</div>
          </div>
        )}
      </div>

      {/* Overlay khi sidebar mở trên mobile */}
      {isOpen && (
        <div
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 40
          }}
          onClick={onToggle}
        />
      )}
    </>
  );
}
