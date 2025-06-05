import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Set this to true to enable production mode restrictions
const IS_PRODUCTION = false

export function middleware(request: NextRequest) {
  console.log('Middleware executing...')
  
  if (IS_PRODUCTION) {
    console.log('Production mode detected')
    const path = request.nextUrl.pathname
    console.log('Current path:', path)

    // Allow access to games route and its sub-routes
    if (path.startsWith('/games')) {
      console.log('Allowing access to games route')
      return NextResponse.next()
    }

    // Allow access to API routes
    if (path.startsWith('/api')) {
      console.log('Allowing access to API route')
      return NextResponse.next()
    }

    // Allow access to static files and assets
    if (
      path.startsWith('/_next') ||
      path.startsWith('/static') ||
      path.includes('.')
    ) {
      console.log('Allowing access to static assets')
      return NextResponse.next()
    }

    console.log('Redirecting to coming soon page')
    // Redirect all other routes to coming soon page
    return NextResponse.rewrite(new URL('/coming-soon', request.url))
  }

  console.log('Not in production mode, allowing access')
  return NextResponse.next()
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
} 