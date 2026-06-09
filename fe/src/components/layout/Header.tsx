'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingBag, ShoppingCart, User, ChevronDown, LogOut, LogIn, UserPlus, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CartService } from '@/services/cart.service';
import Topbar from './Topbar';
import { SiteConfigService } from '@/services/siteConfig.service';

export default function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/san-pham?keyword=${encodeURIComponent(searchKeyword.trim())}`);
      setSearchKeyword('');
    }
  };

  useEffect(() => {
    // Basic check for auth token in cookies
    const checkAuth = () => {
      const match = document.cookie.match(/(^|;)\s*accessToken\s*=\s*([^;]+)/);
      setIsLogged(!!(match && match[2]));
    };
    checkAuth();

    // Listen to changes if needed across tabs
    window.addEventListener('focus', checkAuth);
    
    // Fetch site config
    const loadSiteConfig = async () => {
      try {
        const configs = await SiteConfigService.getAllConfigs();
        
        if (configs['announcement_bar_text']) {
          setAnnouncementText(configs['announcement_bar_text']);
        }
        if (configs['announcement_bar_enabled']) {
          setAnnouncementEnabled(configs['announcement_bar_enabled'] === 'true');
        }
      } catch (err) {
        console.error('Failed to load site config:', err);
      }
    };
    loadSiteConfig();

    return () => window.removeEventListener('focus', checkAuth);
  }, []);

  useEffect(() => {
    if (!isLogged) {
      setCartCount(0);
      return;
    }
    const loadCart = async () => {
      try {
        const items = await CartService.getCartItems();
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      } catch (err) {
        console.error('[Header] Failed to load cart:', err);
      }
    };
    loadCart();

    const handleCartUpdate = () => loadCart();
    window.addEventListener('cart_updated', handleCartUpdate);
    return () => window.removeEventListener('cart_updated', handleCartUpdate);
  }, [isLogged]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setIsLogged(false);
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      <Topbar text={announcementText} enabled={announcementEnabled} />
      <header className="w-full bg-white text-[#194A33] py-1 px-8 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        {/* Logo */}
      <div className="text-4xl font-serif font-bold tracking-wider">
        <Link href="/">
          <Image
            src="/theme_config/logo.png"
            alt="Oriental Herbs Logo"
            width={90}
            height={90}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex space-x-8 font-medium">
        <Link href="/" className="hover:text-green-700 transition-colors">Trang chủ</Link>
        <Link href="/san-pham" className="hover:text-green-700 transition-colors flex items-center gap-1">
          Sản phẩm
        </Link>
        {/* <ChevronDown size={14}*/}
        {/*<Link href="/sale" className="hover:text-green-700 transition-colors">Sale</Link>*/}
        <Link href="/about" className="hover:text-green-700 transition-colors">Về chúng tôi</Link>
        {/*<Link href="/blog" className="hover:text-green-700 transition-colors">Blog</Link>*/}
        <Link href="/lien-he" className="hover:text-green-700 transition-colors flex items-center gap-1">
          Liên hệ 
        </Link>
      </nav>

      {/* Search Input & Icons */}
      <div className="flex space-x-6 items-center">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative hidden lg:flex items-center w-64">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full h-9 pl-4 pr-10 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#A57322] focus:ring-1 focus:ring-[#A57322] transition-colors bg-gray-50 text-gray-700"
          />
          <button 
            type="submit" 
            aria-label="Search" 
            className="absolute right-3 text-gray-400 hover:text-[#A57322] transition-colors"
          >
            <Search size={18} />
          </button>
        </form>

        <Link href="/tai-khoan/don-hang" aria-label="Orders" className="hover:text-green-700 transition-colors">
          <ClipboardList size={22} />
        </Link>
        <Link href="/gio-hang" aria-label="Cart" className="relative hover:text-green-700 transition-colors">
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white flex items-center justify-center min-w-[16px] h-[16px]">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </Link>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            aria-label="User profile"
            className="hover:text-green-700 transition-colors flex items-center gap-1"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <User size={22} /> <ChevronDown size={14} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-4 w-max min-w-[200px] bg-[#A57322] text-white rounded shadow-lg z-50 overflow-hidden flex flex-col py-2" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              {isLogged ? (
                <>
                  <Link
                    href="/tai-khoan/ho-so"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-[#8f631d] transition-colors whitespace-nowrap"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User size={20} strokeWidth={1.5} />
                    <span className="text-base font-medium">Thông tin tài khoản</span>
                  </Link>
                  <Link
                    href="/tai-khoan/don-hang"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-[#8f631d] transition-colors whitespace-nowrap"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <ShoppingBag size={20} strokeWidth={1.5} />
                    <span className="text-base font-medium">Đơn hàng</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-[#8f631d] transition-colors text-left w-full whitespace-nowrap"
                  >
                    <LogOut size={20} strokeWidth={1.5} />
                    <span className="text-base font-medium">Đăng xuất</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/dang-nhap"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-[#8f631d] transition-colors whitespace-nowrap"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <LogIn size={20} strokeWidth={1.5} />
                    <span className="text-base font-medium">Đăng nhập</span>
                  </Link>
                  <Link
                    href="/dang-ki"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-[#8f631d] transition-colors whitespace-nowrap"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <UserPlus size={20} strokeWidth={1.5} />
                    <span className="text-base font-medium">Đăng ký</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
}