
import { NextRequest, NextResponse } from 'next/server';

const whitelist = ['/login', '/signup', '/userconfirmation', '/recover', '/resetpassword', '/server-offline', '/unsubscribe', '/clients/unsubscribe', '/users/unsubscribe', '/geo-blocked'];

function isPublicRoute(pathname: string) {
  if (whitelist.some((path) => path === pathname)) {
    return true;
  }

  if (pathname.startsWith('/accept-company-invitation/')) {
    return true;
  }

  if (
    pathname === '/auth' ||
    pathname.startsWith('/client-portal') ||
    pathname.startsWith('/pay/') ||
    pathname.startsWith('/invoices/pay/') ||
    pathname === '/estimates/respond' ||
    pathname.startsWith('/estimates/respond/')
  ) {
    return true;
  }

  return false;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Geo-blocking: Block all non-US users (including public routes)
  // Comment out the lines below if you want to allow login/signup from anywhere
  const country = req.geo?.country || req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || req.headers.get('x-country-code');
  
  // Only allow US users
  if (country && (country !== 'US' && country !== 'BR')) {
    return NextResponse.rewrite(new URL('/geo-blocked', req.url));
  }

  // for public routes, we don't need to check for a token
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // check if token exists
  const token = req.cookies.get('accessToken')?.value;

  // // if no token found, redirect to login page
  if (!token || token === '') {
    return NextResponse.rewrite(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
