import { NextResponse, type NextRequest } from 'next/server'

// Lightweight auth gate: check for the presence of the Supabase auth cookie.
// We intentionally do NOT call supabase.auth.getUser() here — that makes a
// network validation call from the edge runtime which was intermittently
// returning "no user" even with a valid session cookie, causing a redirect
// loop back to /login after a successful sign-in. Full session validation
// still happens in the pages (client) and API routes (server).
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.includes('-auth-token') && !c.name.endsWith('-code-verifier') && c.value)

  const isAppRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/interview') ||
    pathname.startsWith('/practice') ||
    pathname.startsWith('/question-bank') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/test') ||
    pathname.startsWith('/coding') ||
    pathname.startsWith('/cv-analyzer') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/subscription') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/jobs') ||
    pathname.startsWith('/video-interview') ||
    pathname.startsWith('/resume-builder')

  if (isAppRoute && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasSession && (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/callback).*)',
  ],
}
