import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  // Prepare a mutable response so we can write session cookies onto it
  const redirectOnError = (detail: string) =>
    NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${encodeURIComponent(detail)}`)

  let redirectTo = `${origin}/onboarding/profile`
  const response = NextResponse.redirect(redirectTo)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return redirectOnError(error?.message ?? 'no_user')
  }

  const user = data.user

  // Use service-role client to check/create user row (bypasses RLS)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: existing } = await admin
    .from('users')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing) {
    await admin.from('users').upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? null,
      onboarding_complete: false,
    }, { onConflict: 'id' })
  }

  redirectTo = existing?.onboarding_complete
    ? `${origin}/dashboard`
    : `${origin}/onboarding/profile`

  // Update the redirect URL on the response (cookies already set above)
  return NextResponse.redirect(redirectTo, {
    headers: response.headers,
  })
}
