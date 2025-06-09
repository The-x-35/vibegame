import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Force production mode
const IS_PRODUCTION = true

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // If not in production, allow all requests
  if (!IS_PRODUCTION) {
    return NextResponse.next()
  }

  // List of paths that are always allowed
  const allowedPaths = [
    '/coming-soon',
    '/terms',
    '/privacy',
    '/_next',
    '/api',
    '/static',
    '/favicon.ico',
    '/sa-logo.svg',
    '/test-logo.svg'
  ]

  // Check if the current path should be allowed
  const isAllowed = allowedPaths.some(allowedPath => 
    path === allowedPath || path.startsWith(allowedPath + '/')
  )

  // If the path is allowed, proceed
  if (isAllowed) {
    return NextResponse.next()
  }

  // For all other paths, redirect to coming soon
  return NextResponse.redirect(new URL('/coming-soon', request.url))
}

// Match all paths except the ones we want to exclude
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sa-logo.svg|test-logo.svg).*)']
} 