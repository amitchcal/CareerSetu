'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'

// ─── Constants ────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 30

// ─── Types ────────────────────────────────────────────────────────────────────

type Method = 'choose' | 'email'
type Step = 'input' | 'otp'

interface AuthFormProps {
  mode: 'signup' | 'login'
}

// ─── Google SVG icon ──────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

// ─── OTP Input boxes ──────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  onComplete,
}: {
  value: string
  onChange: (v: string) => void
  onComplete: (v: string) => void
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  function handleChange(index: number, char: string) {
    const digit = char.replace(/\D/g, '').slice(-1)
    const arr = value.split('')
    arr[index] = digit
    const next = arr.join('').padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH)
    const trimmed = next.trimEnd()
    onChange(trimmed)
    if (digit) {
      if (index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus()
      } else if (trimmed.replace(/\s/g, '').length === OTP_LENGTH) {
        onComplete(trimmed)
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const arr = value.split('')
      if (arr[index]) {
        arr[index] = ''
        onChange(arr.join(''))
      } else if (index > 0) {
        arr[index - 1] = ''
        onChange(arr.join(''))
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
    if (pasted.length === OTP_LENGTH) onComplete(pasted)
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`OTP digit ${i + 1}`}
          className="h-12 w-11 rounded-xl border-2 border-gray-200 text-center text-lg font-semibold text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:h-14 sm:w-12"
        />
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()

  const [method, setMethod] = useState<Method>('choose')
  const [step, setStep] = useState<Step>('input')

  // Email OTP state
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // ── Google OAuth ─────────────────────────────────────────────────────────────

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      // Browser will redirect — no further action needed
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not sign in with Google.'
      toast({ title: 'Google sign-in failed', description: message, variant: 'destructive' })
      setGoogleLoading(false)
    }
  }

  // ── Email OTP: Send ──────────────────────────────────────────────────────────

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  }

  async function handleSendEmailOtp() {
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address.')
      return
    }
    if (mode === 'signup' && !termsAccepted) return
    setEmailError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      setStep('otp')
      setCooldown(RESEND_COOLDOWN)
      setOtp('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP.'
      toast({ title: 'Error sending OTP', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ── Email OTP: Verify ────────────────────────────────────────────────────────

  const handleVerifyEmailOtp = useCallback(
    async (code: string) => {
      if (code.length < OTP_LENGTH) return
      setLoading(true)
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: 'email',
        })
        if (error) throw error

        const userId = data.user?.id
        if (!userId) throw new Error('No user returned.')

        // Check or create user row
        const { data: existing, error: fetchErr } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('id', userId)
          .maybeSingle()
        if (fetchErr) throw fetchErr

        if (!existing) {
          const { error: insertErr } = await supabase
            .from('users')
            .insert({ phone: email, onboarding_complete: false })
          if (insertErr) throw insertErr
          router.push('/onboarding/profile')
        } else if (!existing.onboarding_complete) {
          router.push('/onboarding/profile')
        } else {
          router.push('/dashboard')
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Incorrect OTP. Please try again.'
        toast({ title: 'Verification failed', description: message, variant: 'destructive' })
        setOtp('')
        setLoading(false)
      }
    },
    [email, router]
  )

  async function handleResendEmailOtp() {
    if (cooldown > 0) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      setCooldown(RESEND_COOLDOWN)
      setOtp('')
      toast({ title: 'OTP resent', description: 'A new code has been sent to your email.' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not resend OTP.'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ── Render: OTP verification step (email) ────────────────────────────────────

  if (method === 'email' && step === 'otp') {
    return (
      <div className="flex flex-col gap-6">
        <button
          onClick={() => { setStep('input'); setOtp('') }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Change email
        </button>

        <p className="text-sm text-gray-600 text-center">
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-gray-900">{email}</span>
        </p>

        <OtpInput value={otp} onChange={setOtp} onComplete={handleVerifyEmailOtp} />

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying…
          </div>
        )}

        {!loading && (
          <button
            onClick={() => handleVerifyEmailOtp(otp)}
            disabled={otp.length < OTP_LENGTH}
            className="flex items-center justify-center rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify OTP
          </button>
        )}

        <div className="text-center">
          {cooldown > 0 ? (
            <p className="text-sm text-gray-400">
              Resend in{' '}
              <span className="font-semibold tabular-nums text-gray-600">{cooldown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResendEmailOtp}
              disabled={loading}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Render: Email input step ─────────────────────────────────────────────────

  if (method === 'email') {
    const canSubmit = isValidEmail(email) && (mode === 'login' || termsAccepted)
    return (
      <div className="flex flex-col gap-5">
        <button
          onClick={() => { setMethod('choose'); setEmail(''); setEmailError('') }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Other sign-in options
        </button>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendEmailOtp() }}
            className={`rounded-xl border-2 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
              emailError ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          {emailError && <p className="text-xs text-red-600">{emailError}</p>}
        </div>

        {mode === 'signup' && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-indigo-600 cursor-pointer"
            />
            <span className="text-sm text-gray-600 leading-relaxed">
              I agree to the{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer"
                className="text-indigo-600 underline underline-offset-2 hover:text-indigo-700">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer"
                className="text-indigo-600 underline underline-offset-2 hover:text-indigo-700">
                Privacy Policy
              </Link>
            </span>
          </label>
        )}

        <button
          onClick={handleSendEmailOtp}
          disabled={!canSubmit || loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send OTP
        </button>

        <p className="text-center text-sm text-gray-500">
          {mode === 'signup' ? (
            <>Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Log in</Link>
            </>
          ) : (
            <>New to CareerSetu?{' '}
              <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">Sign up free</Link>
            </>
          )}
        </p>
      </div>
    )
  }

  // ── Render: Method chooser ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Google */}
      <button
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        ) : (
          <GoogleIcon />
        )}
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Email OTP */}
      <button
        onClick={() => setMethod('email')}
        className="flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98]"
      >
        <Mail className="h-5 w-5 text-gray-500" />
        Continue with Email OTP
      </button>

      {/* Toggle mode */}
      <p className="text-center text-sm text-gray-500 pt-1">
        {mode === 'signup' ? (
          <>Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Log in</Link>
          </>
        ) : (
          <>New to CareerSetu?{' '}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">Sign up free</Link>
          </>
        )}
      </p>
    </div>
  )
}
