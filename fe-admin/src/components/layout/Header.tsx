'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { authService, JwtResponse } from '@/services/auth.service';

interface HeaderProps {
  onMenuClick: () => void;
  user?: JwtResponse | null;
}

export default function Header({ onMenuClick, user }: HeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    authService.logout();
    router.push('/dang-nhap');
  };

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #f0f0f0',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onMenuClick}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666'
          }}
        >
          <Menu size={24} />
        </button>
        <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
          Admin Dashboard
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* User Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f5f5f5',
              border: '1px solid #e0e0e0',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#333'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#efefef';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5';
            }}
          >
            <User size={18} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              {user?.fullName || 'Admin'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: '180px',
              zIndex: 1000
            }}>
              {/* User Info */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
                  {user?.fullName}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {user?.email}
                </div>
              </div>

              {/* Profile Link */}
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/cai-dat-tai-khoan');
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#333',
                  fontSize: '14px',
                  fontWeight: 500,
                  borderBottom: '1px solid #f0f0f0'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'none';
                }}
              >
                <User size={16} />
                Cài đặt tài khoản
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#d32f2f',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#fff3e0';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'none';
                }}
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
