import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Force production mode
const IS_PRODUCTION = false

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Extract the subdomain and check if we're on localhost or vibegame.fun
  const [subdomain, ...rest] = hostname.split('.');
  const isLocalhost = rest.includes('localhost');
  const isVibegameFun = rest.includes('vibegame.fun');
  
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