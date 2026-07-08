'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import AuthLayout from '@/components/shared/AuthLayout'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Supabase sends a recovery link with #access_token=... fragment.
    // We need to exchange it for a session before allowing the password update.
    async function init() {
      const hash = window.location.hash
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.replace('#', ''))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token') ?? ''
        if (accessToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          if (error) {
            toast({ title: 'Invalid or expired reset link', description: 'Please request a new reset link.', variant: 'destructive' })
            router.replace('/forgot-password')
            return
          }
        }
      }
      // Also handle PKCE code in query params (newer Supabase versions)
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          toast({ title: 'Invalid or expired reset link', description: 'Please request a new reset link.', variant: 'destructive' })
          router.replace('/forgot-password')
          return
        }
      }
      setReady(true)
    }
    init()
  }, [router])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { toast({ title: 'Password too short', description: 'At least 6 characters required.', variant: 'destructive' }); return }
    if (password !== confirm) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast({ title: 'Password updated', description: 'You can now sign in with your new password.' })
      router.replace('/dashboard')
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update password.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleReset} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">New password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              className="w-full rounded-xl border-2 border-gray-200 px-3.5 py-3 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Confirm password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
            className="rounded-xl border-2 border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  )
}
