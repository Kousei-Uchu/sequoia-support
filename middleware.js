// middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const session = await getToken({ req });
  const { pathname } = req.nextUrl;

  // Protected paths
  const protectedRoutes = [
    '/editor',
  ];

  // Auth routes
  const authRoutes = [
    '/auth/signin',
    '/auth/error'
  ];

  // 1. Redirect to login if trying to access protected routes while unauthenticated
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !session) {
    return NextResponse.redirect(new URL('/api/auth/signin', req.url));
  }

  // 2. Redirect to username setup if authenticated but missing username
  if (session && !session.username && !pathname.startsWith('/setup')) {
    return NextResponse.redirect(new URL('/setup', req.url));
  }

  // 3. Redirect away from auth/setup pages if already properly authenticated
  if (session?.username) {
    if (authRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (pathname.startsWith('/setup')) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

// Match all relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/image-proxy.js|api/get-profile.js).*)',
  ],
};
