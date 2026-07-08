import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = 'https://bnxshcckbasylmvbsagc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGci••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAppRoute = pathname.startsWith('/dashboard') ||
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

  if (isAppRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/callback).*)',
  ],
}
