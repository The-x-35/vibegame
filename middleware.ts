import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Force production mode
const IS_PRODUCTION = true

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostHeader = request.headers.get('host') || '';
  // Remove the port (e.g. :3000) if it exists so that subdomain extraction works
  const hostname = hostHeader.split(':')[0];
  
  // Extract the subdomain and check the base domain
  const parts = hostname.split('.');
  // Handle cases like "mario.localhost" (length 2) and "mario.vibegame.fun" (length 3)
  const subdomain = parts.length > 2
    ? parts[0]
    : parts.length === 2 && parts[1] === 'localhost'
      ? parts[0]
      : '';

  const isLocalhost = hostname.endsWith('localhost');
  const isVibegameFun = hostname.endsWith('vibegame.fun');
  
  // Redirect all routes to /coming-soon when in production, except /game/*
  if (IS_PRODUCTION) {
    const isGamePath = url.pathname.startsWith('/game/');
    const isComingSoon = url.pathname === '/coming-soon';
    const isStaticAsset = url.pathname.includes('.');
    const isSubdomainRequest = subdomain && subdomain !== 'www' && subdomain !== 'app' && (isLocalhost || isVibegameFun);
    if (!isGamePath && !isComingSoon && !isStaticAsset && !isSubdomainRequest) {
      url.pathname = '/coming-soon';
      return NextResponse.redirect(url);
    }
  }
  
  // Only handle subdomain routing if we're on a subdomain and it's not 'www' or 'app'
  if (subdomain && subdomain !== 'www' && subdomain !== 'app' && (isLocalhost || isVibegameFun)) {
    // If the path is just '/' or empty, route to the game page
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = `/games/${subdomain}`;
      return NextResponse.rewrite(url);
    }
  }
  
  return NextResponse.next();
}

// Match all paths except the ones we want to exclude
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