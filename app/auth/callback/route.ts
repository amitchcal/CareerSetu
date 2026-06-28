import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const user = data.user

  // Check if user row exists; create if not
  const { data: existing } = await supabase
    .from('users')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing) {
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? null,
      onboarding_complete: false,
    }, { onConflict: 'id' })
    return NextResponse.redirect(`${origin}/onboarding/profile`)
  }

  if (!existing.onboarding_complete) {
    return NextResponse.redirect(`${origin}/onboarding/profile`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
