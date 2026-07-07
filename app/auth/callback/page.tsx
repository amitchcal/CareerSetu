'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search)

      // If Supabase/Google returned an error in the redirect URL, show it
      const oauthError = params.get('error_description') ?? params.get('error')
      if (oauthError) {
        setErrorMsg(oauthError)
        return
      }

      // PKCE flow: Supabase redirects with ?code=xxx — must exchange it for a session
      const code = params.get('code')
      if (code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeErr) {
          setErrorMsg(exchangeErr.message)
          return
        }
      }

      // Implicit / magic-link flow: tokens arrive in the URL hash — Supabase
      // detects and stores them automatically when the client initialises.
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession()

      if (sessionErr || !session) {
        setErrorMsg('Could not retrieve session. Please try signing in again.')
        return
      }

      const userId = session.user.id
      const userEmail = session.user.email ?? ''

      // Check or create the users row
      const { data: existing, error: fetchErr } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', userId)
        .maybeSingle()

      if (fetchErr) {
        setErrorMsg('Account lookup failed. Please try again.')
        return
      }

      if (!existing) {
        const { error: insertErr } = await supabase
          .from('users')
          .insert({ phone: userEmail, onboarding_complete: false })

        if (insertErr) {
          console.warn('[auth/callback] insert error:', insertErr.message)
        }
        router.replace('/onboarding/profile')
      } else if (!existing.onboarding_complete) {
        router.replace('/onboarding/profile')
      } else {
        router.replace('/dashboard')
      }
    }

    handleCallback()
  }, [router])

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-center max-w-sm w-full">
          <p className="text-sm font-semibold text-red-700 mb-1">Sign in failed</p>
          <p className="text-sm text-red-600">{errorMsg}</p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back to login
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
      <p className="text-sm text-gray-500">Signing you in…</p>
    </div>
  )
}
