'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        // Exchange the code for a session client-side
        // (browser client has access to the PKCE code verifier in localStorage/cookies)
        const { data, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        // If no session yet, try exchanging the code from the URL
        if (!data.session) {
          const params = new URLSearchParams(window.location.search)
          const code = params.get('code')

          if (!code) {
            router.replace('/login?error=missing_code')
            return
          }

          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError || !exchangeData.session) {
            throw exchangeError ?? new Error('No session returned')
          }
        }

        // Session established — check onboarding status
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.replace('/login?error=no_session'); return }

        const { data: user } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('id', session.user.id)
          .maybeSingle()

        if (!user) {
          // New user — create row
          await supabase.from('users').upsert({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name ?? null,
            onboarding_complete: false,
          }, { onConflict: 'id' })
          router.replace('/onboarding/profile')
        } else if (!user.onboarding_complete) {
          router.replace('/onboarding/profile')
        } else {
          router.replace('/dashboard')
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Authentication failed'
        console.error('[auth/callback]', msg)
        setError(msg)
        setTimeout(() => router.replace(`/login?error=auth_failed&detail=${encodeURIComponent(msg)}`), 2000)
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Sign in failed</p>
          <p className="text-sm text-gray-500">{error}</p>
          <p className="text-xs text-gray-400 mt-2">Redirecting to login…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-gray-500">Signing you in…</p>
      </div>
    </div>
  )
}
