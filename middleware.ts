import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Redirect www to apex domain (non-www)
  if (hostname.startsWith('www.')) {
    const newHost = hostname.replace(/^www\./, '');
    return NextResponse.redirect(`${url.protocol}//${newHost}${url.pathname}${url.search}`, 308);
  }
  
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
      url.pathname = `/games/${subdomain}`;
      return NextResponse.rewrite(url);
    }
    
    // For other paths, let them pass through normally
    return NextResponse.next();
  }

  return NextResponse.next();
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