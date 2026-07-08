'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'

interface Props {
  mode: 'signup' | 'login'
}

type AuthMethod = 'choose' | 'email-password' | 'email-otp' | 'otp-verify'

export default function GoogleAuthButton({ mode }: Props) {
  const router = useRouter()
  const [method, setMethod] = useState<AuthMethod>('choose')
  const [loading, setLoading] = useState(false)

  // email+password fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')

  // OTP fields
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function handleGoogleAuth() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch (err: unknown) {
      toast({ title: 'Sign in failed', description: err instanceof Error ? err.message : 'Failed to sign in with Google.', variant: 'destructive' })
      setLoading(false)
    }
  }

  // ── Email + Password ──────────────────────────────────────────────────────
  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { toast({ title: 'Email required', variant: 'destructive' }); return }
    if (password.length < 6) { toast({ title: 'Password too short', description: 'At least 6 characters required.', variant: 'destructive' }); return }
    if (mode === 'signup' && !name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        await ensureUserRow(data.user.id, data.user.email ?? '', null)
        router.replace('/dashboard')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        })
        if (error) throw error
        if (data.user) {
          await ensureUserRow(data.user.id, data.user.email ?? '', name.trim())
          if (data.session) {
            router.replace('/onboarding/profile')
          } else {
            toast({ title: 'Verify your email', description: 'A confirmation link was sent to your inbox. Click it to continue.' })
          }
        }
      }
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ── Email OTP — send ──────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otpEmail.trim()) { toast({ title: 'Email required', variant: 'destructive' }); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail.trim(),
        options: { shouldCreateUser: true },
      })
      if (error) throw error
      setMethod('otp-verify')
      toast({ title: 'OTP sent', description: `Check ${otpEmail} for a 6-digit code.` })
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to send OTP.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ── Email OTP — verify ────────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otpCode.length !== 6) { toast({ title: 'Enter the 6-digit code', variant: 'destructive' }); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: otpEmail.trim(),
        token: otpCode.trim(),
        type: 'email',
      })
      if (error) throw error
      if (data.user) {
        const row = await ensureUserRow(data.user.id, data.user.email ?? '', null)
        router.replace(row.is_new ? '/onboarding/profile' : '/dashboard')
      }
    } catch (err: unknown) {
      toast({ title: 'Invalid code', description: err instanceof Error ? err.message : 'The OTP is incorrect or expired.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ── Helper ────────────────────────────────────────────────────────────────
  async function ensureUserRow(id: string, userEmail: string, displayName: string | null) {
    const { data: existing } = await supabase.from('users').select('id, onboarding_complete').eq('id', id).maybeSingle()
    if (!existing) {
      await supabase.from('users').upsert({ id, email: userEmail, name: displayName }, { onConflict: 'id' })
      return { is_new: true }
    }
    return { is_new: !existing.onboarding_complete }
  }

  // ── Google button (reused) ────────────────────────────────────────────────
  const GoogleBtn = () => (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )}
      {loading ? 'Redirecting…' : 'Continue with Google'}
    </button>
  )

  const Divider = () => (
    <div className="relative flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-xs text-gray-400 select-none">or</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  )

  const SwitchLink = () => (
    <p className="text-center text-sm text-gray-500">
      {mode === 'signup' ? (
        <>Already have an account?{' '}<Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Log in</Link></>
      ) : (
        <>New to CareerSetu?{' '}<Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">Sign up free</Link></>
      )}
    </p>
  )

  // ── Screens ───────────────────────────────────────────────────────────────

  if (method === 'choose') {
    return (
      <div className="flex flex-col gap-4">
        <GoogleBtn />
        <Divider />
        <button
          type="button"
          onClick={() => setMethod('email-password')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-[0.98]"
        >
          <Mail className="h-4 w-4 text-gray-400" />
          Continue with Email &amp; Password
        </button>
        <button
          type="button"
          onClick={() => setMethod('email-otp')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-[0.98]"
        >
          <Lock className="h-4 w-4 text-gray-400" />
          Continue with Email OTP
        </button>
        <SwitchLink />
      </div>
    )
  }

  if (method === 'email-password') {
    return (
      <div className="flex flex-col gap-4">
        <button type="button" onClick={() => setMethod('choose')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 -mb-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <form onSubmit={handleEmailPassword} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Priya Sharma"
                autoComplete="name"
                className="rounded-xl border-2 border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="rounded-xl border-2 border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Password</label>
              {mode === 'login' && (
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <Divider />
        <GoogleBtn />
        <p className="text-center text-sm text-gray-500">
          {mode === 'signup' ? (
            <>Already have an account?{' '}<Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Log in</Link></>
          ) : (
            <>New to CareerSetu?{' '}<Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">Sign up free</Link></>
          )}
        </p>
      </div>
    )
  }

  if (method === 'email-otp') {
    return (
      <div className="flex flex-col gap-4">
        <button type="button" onClick={() => setMethod('choose')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 -mb-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={otpEmail}
              onChange={e => setOtpEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="rounded-xl border-2 border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
        <Divider />
        <GoogleBtn />
        <p className="text-center text-sm text-gray-500">
          {mode === 'signup' ? (
            <>Already have an account?{' '}<Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Log in</Link></>
          ) : (
            <>New to CareerSetu?{' '}<Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">Sign up free</Link></>
          )}
        </p>
      </div>
    )
  }

  // OTP verify screen
  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={() => setMethod('email-otp')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 -mb-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <p className="text-sm text-gray-600 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
        A 6-digit code was sent to <span className="font-medium text-indigo-700">{otpEmail}</span>. Enter it below.
      </p>
      <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">OTP Code</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otpCode}
            onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="rounded-xl border-2 border-gray-200 px-3.5 py-3 text-sm tracking-widest outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Verifying…' : 'Verify & Sign in'}
        </button>
      </form>
      <button
        type="button"
        onClick={handleSendOtp as unknown as React.MouseEventHandler}
        disabled={loading}
        className="text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
      >
        Resend code
      </button>
    </div>
  )
}
