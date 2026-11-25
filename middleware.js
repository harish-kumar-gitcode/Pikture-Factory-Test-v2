import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Middleware runs on the Edge runtime, which can't use the Node-only
// `jsonwebtoken` package — we use `jose` here instead (Web Crypto based).
// Route handlers (app/api/**) still use `jsonwebtoken` via lib/auth.js since
// they run on the Node runtime by default. Both sign/verify HS256 with the
// same JWT_SECRET, so tokens are fully compatible between the two.
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

async function getRole(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload?.role || null;
  } catch (e) {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('pf_token')?.value;
  const role = token ? await getRole(token) : null;

  const isAdminRoute = pathname.startsWith('/admin');
  const isVendorRoute = pathname.startsWith('/vendor') && !pathname.startsWith('/vendor-apply');
  const isClientRoute = pathname.startsWith('/client');

  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/login/admin', request.url));
  }
  if (isVendorRoute && role !== 'vendor') {
    return NextResponse.redirect(new URL('/login/vendor', request.url));
  }
  if (isClientRoute && role !== 'client') {
    return NextResponse.redirect(new URL('/login/client', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/vendor/:path*', '/client/:path*'],
};
