import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - allow without checking
  const publicRoutes = ['/dang-nhap', '/dang-ki', '/api'];
  
  // Protected routes - require authentication
  const protectedRoutes = ['/', '/don-hang', '/hoan-hang', '/danh-muc', '/san-pham', '/khach-hang', '/chien-dich', '/appearance', '/homepage-layout', '/trang-tinh', '/lien-he'];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // Skip middleware for API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check for token in cookies
  const token = request.cookies.get('adminToken')?.value;

  // If trying to access protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const url = new URL('/dang-nhap', request.url);
    return NextResponse.redirect(url);
  }

  // If already logged in and trying to access login/register, redirect to dashboard
  if (pathname === '/dang-nhap' || pathname === '/dang-ki') {
    if (token) {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Apply middleware to all routes except static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

