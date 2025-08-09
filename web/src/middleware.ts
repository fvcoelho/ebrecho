import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RESERVED_PATHS = [
  'admin',
  'api', 
  'login',
  'cadastro',
  'dashboard',
  'produtos',
  'verificar-email',
  'recuperar-senha',
  'setup-loja',
  'test-api',
  'test',
  '_next',
  'favicon.ico'
]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const firstSegment = pathname.split('/')[1]
  
  // Skip static files and reserved paths
  if (
    RESERVED_PATHS.includes(firstSegment) ||
    pathname.includes('.') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next()
  }

  // For dynamic store slugs, let them through to be handled by the route
  // The actual validation will happen in the page component
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