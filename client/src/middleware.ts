import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isTokenValid(token?: string): { valid: boolean; roles: string[] } {
  if (!token) return { valid: false, roles: [] };
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, roles: [] };
    let payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = payloadBase64.length % 4;
    if (pad) {
      payloadBase64 += '='.repeat(4 - pad);
    }
    const payloadDecoded = JSON.parse(atob(payloadBase64));
    
    // Check expiration (exp is in seconds)
    if (payloadDecoded.exp && payloadDecoded.exp * 1000 < Date.now()) {
      return { valid: false, roles: [] };
    }
    
    const roles = Array.isArray(payloadDecoded.roles) ? payloadDecoded.roles : [];
    return { valid: true, roles };
  } catch {
    return { valid: false, roles: [] };
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawCookieToken = request.cookies.get('accessToken')?.value;
  const { valid: isAuthenticated, roles } = isTokenValid(rawCookieToken);

  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const isOwner = roles.includes('OWNER') || isSuperAdmin || roles.includes('ADMIN');
  const isBarber = roles.includes('BARBER');
  const isEmployee = roles.includes('EMPLOYEE');
  const isCustomer = roles.includes('CUSTOMER');

  const fallbackRedirect = isOwner ? '/owner' : (isBarber ? '/barber/dashboard' : (isCustomer ? '/customer' : '/login'));

  const clearCookieIfInvalid = (res: NextResponse) => {
    if (rawCookieToken && !isAuthenticated) {
      res.cookies.delete('accessToken');
    }
    return res;
  };

  // 1. Protected areas: Redirect unauthenticated or expired users to /login
  if (pathname.startsWith('/owner') || pathname.startsWith('/barber') || pathname.startsWith('/employee') || pathname.startsWith('/customer')) {
    if (!isAuthenticated) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      return clearCookieIfInvalid(response);
    }
  }

  // 2. Role-specific protection
  if (pathname.startsWith('/owner')) {
    if (!isOwner) {
      return NextResponse.redirect(new URL(fallbackRedirect, request.url));
    }
  }

  if (pathname.startsWith('/barber')) {
    if (!isBarber && !isOwner) {
      return NextResponse.redirect(new URL(fallbackRedirect, request.url));
    }
  }

  if (pathname.startsWith('/employee')) {
    if (!isEmployee && !isOwner) {
      return NextResponse.redirect(new URL(fallbackRedirect, request.url));
    }
  }

  if (pathname.startsWith('/customer')) {
    if (!isCustomer && !isOwner && !isBarber) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      return clearCookieIfInvalid(response);
    }
  }

  // 3. Login & Register routing: only redirect if authenticated with a VALID token!
  if (pathname === '/login' || pathname === '/register') {
    if (isAuthenticated && fallbackRedirect !== '/login') {
      return NextResponse.redirect(new URL(fallbackRedirect, request.url));
    }
    // If cookie is invalid or expired, clear it and let login page load
    const response = NextResponse.next();
    return clearCookieIfInvalid(response);
  }

  // 4. Handle old admin/dashboard paths
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    const target = isAuthenticated ? fallbackRedirect : '/login';
    const response = NextResponse.redirect(new URL(target, request.url));
    return clearCookieIfInvalid(response);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/owner/:path*', '/barber/:path*', '/employee/:path*', '/customer/:path*', '/admin/:path*', '/dashboard/:path*', '/login', '/register'],
};
