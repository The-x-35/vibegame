import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Extract the subdomain and check if we're on localhost or vibegame.fun
  const [subdomain, ...rest] = hostname.split('.');
  const domain = rest.join('.');
  const isLocalhost = domain.startsWith('localhost');
  const isVibegameFun = domain === 'vibegame.fun';
  
  // If we're on the main domain (no subdomain), let it pass through
  if (
    hostname === 'vibegame.fun' ||
    hostname === 'localhost:3000' ||
    hostname === 'localhost'
  ) {
    return NextResponse.next();
  }
  
  // Only handle subdomain routing if we're on a subdomain and it's not 'www' or 'app'
  if (subdomain && subdomain !== 'www' && subdomain !== 'app' && (isLocalhost || isVibegameFun)) {
    // For the root path, show the game page
    if (url.pathname === '/' || url.pathname === '') {
      // Only rewrite if we're not already on a game page
      if (!url.pathname.startsWith('/games/')) {
        url.pathname = `/games/${subdomain}`;
        return NextResponse.rewrite(url);
      }
    }
    
    // For other paths, let them pass through normally
    return NextResponse.next();
  }

  // If we get here, it means we're on an invalid subdomain
  // Instead of redirecting, we'll show the 404 page
  url.pathname = '/404';
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 