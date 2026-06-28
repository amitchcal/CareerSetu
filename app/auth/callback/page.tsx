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
        const params = new URLSearchParams(window.location.search)

        // Surface an OAuth provider error passed back in the URL
        const providerError = params.get('error_description') || params.get('error')
        if (providerError) throw new Error(`Provider error: ${providerError}`)

        // We disabled detectSessionInUrl, so exchange the code exactly once here.
        const code = params.get('code')

        let session = (await supabase.auth.getSession()).data.session

        if (!session) {
          if (!code) throw new Error('No authorization code in callback URL')

          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) throw exchangeError
          session = exchangeData.session
        }

        if (!session) throw new Error('No session returned after code exchange')

        // Session established — check onboarding status
        const { data: user, error: userErr } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('id', session.user.id)
          .maybeSingle()

        if (userErr) throw userErr

        if (!user) {
          // New user — create row
          const { error: upsertErr } = await supabase.from('users').upsert({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name ?? null,
            onboarding_complete: false,
          }, { onConflict: 'id' })
          if (upsertErr) throw upsertErr
          router.replace('/onboarding/profile')
        } else if (!user.onboarding_complete) {
          router.replace('/onboarding/profile')
        } else {
          router.replace('/dashboard')
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Authentication failed'
        console.error('[auth/callback]', err)
        setError(msg)
        // Stay on this page so the real error is visible (no auto-redirect).
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <p className="text-red-600 font-medium mb-2">Sign in failed</p>
          <p className="text-sm text-gray-600 break-words rounded-lg bg-red-50 border border-red-100 p-3">{error}</p>
          <a href="/login" className="inline-block mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            ← Back to login
          </a>
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
