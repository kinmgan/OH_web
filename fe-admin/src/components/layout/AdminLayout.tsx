'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { authService, JwtResponse } from '@/services/auth.service';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<JwtResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const currentUser = authService.getUser();
        
        if (!currentUser || !authService.hasAdminRole()) {
          router.push('/dang-nhap');
          return;
        }
        
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to check auth:', error);
        router.push('/dang-nhap');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for custom event to update header when profile is edited
    const handleUserUpdate = () => {
      const updatedUser = authService.getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    };
    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, [router]);


  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#FCF8F1',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#999' }}>Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FCF8F1' }}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          user={user}
        />
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
