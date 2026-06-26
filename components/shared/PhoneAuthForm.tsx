'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'

// ─── Constants ────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 30

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPhone(digits: string) {
  return `+91${digits}`
}

function isValidPhone(digits: string) {
  return /^[6-9]\d{9}$/.test(digits)
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'phone' | 'otp'

interface PhoneAuthFormProps {
  mode: 'signup' | 'login'
}

// ─── OTP Input ────────────────────────────────────────────────────────────────

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
    // Allow only digits
    const digit = char.replace(/\D/g, '').slice(-1)
    const arr = value.split('')
    arr[index] = digit
    const next = arr.join('').padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH)
    // Trim trailing spaces
    const trimmed = next.trimEnd()
    onChange(trimmed)

    if (digit) {
      if (index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus()
      } else {
        // Last digit — auto-submit
        const full = trimmed
        if (full.replace(/\s/g, '').length === OTP_LENGTH) {
          onComplete(full)
        }
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
    if (pasted.length === OTP_LENGTH) {
      onComplete(pasted)
    }
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

export default function PhoneAuthForm({ mode }: PhoneAuthFormProps) {
  const router = useRouter()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────

  function validatePhone(): boolean {
    if (!phone) {
      setPhoneError('Please enter your phone number.')
      return false
    }
    if (!isValidPhone(phone)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number.')
      return false
    }
    setPhoneError('')
    return true
  }

  async function handleSendOtp() {
    if (!validatePhone()) return
    if (mode === 'signup' && !termsAccepted) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formatPhone(phone),
      })
      if (error) throw error

      setStep('otp')
      setCooldown(RESEND_COOLDOWN)
      setOtp('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.'
      toast({ title: 'Error sending OTP', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────

  const handleVerifyOtp = useCallback(
    async (code: string) => {
      if (code.length < OTP_LENGTH) return
      setLoading(true)

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: formatPhone(phone),
          token: code,
          type: 'sms',
        })

        if (error) throw error

        const userId = data.user?.id
        if (!userId) throw new Error('No user returned from OTP verification.')

        // Check or create user row
        const { data: existing, error: fetchErr } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('phone', formatPhone(phone))
          .maybeSingle()

        if (fetchErr) throw fetchErr

        if (!existing) {
          // New user — create row
          const { error: insertErr } = await supabase
            .from('users')
            .insert({ phone: formatPhone(phone), onboarding_complete: false })
          if (insertErr) throw insertErr
          router.push('/onboarding/profile')
        } else if (!existing.onboarding_complete) {
          router.push('/onboarding/profile')
        } else {
          router.push('/dashboard')
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Incorrect OTP. Please try again.'
        toast({ title: 'Verification failed', description: message, variant: 'destructive' })
        setOtp('')
        setLoading(false)
      }
    },
    [phone, router]
  )

  async function handleResend() {
    if (cooldown > 0) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formatPhone(phone),
      })
      if (error) throw error
      setCooldown(RESEND_COOLDOWN)
      setOtp('')
      toast({ title: 'OTP resent', description: 'A new code has been sent to your phone.' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not resend OTP.'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ── Render: Phone step ──────────────────────────────────────────────────────

  if (step === 'phone') {
    const canSubmit = isValidPhone(phone) && (mode === 'login' || termsAccepted)

    return (
      <div className="flex flex-col gap-5">
        {/* Phone field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Mobile number
          </label>
          <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <span className="flex items-center bg-gray-50 px-3.5 text-sm font-medium text-gray-500 border-r border-gray-200 select-none">
              +91
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                setPhone(digits)
                if (phoneError) setPhoneError('')
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendOtp() }}
              className="flex-1 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none"
            />
          </div>
          {phoneError && (
            <p className="text-xs text-red-600">{phoneError}</p>
          )}
        </div>

        {/* Terms checkbox — signup only */}
        {mode === 'signup' && (
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-indigo-600 cursor-pointer"
            />
            <span className="text-sm text-gray-600 leading-relaxed">
              I agree to the{' '}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
              >
                Terms
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
        )}

        {/* Submit */}
        <button
          onClick={handleSendOtp}
          disabled={!canSubmit || loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send OTP
        </button>

        {/* Toggle mode link */}
        <p className="text-center text-sm text-gray-500">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                Log in
              </Link>
            </>
          ) : (
            <>
              New to CareerSetu?{' '}
              <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
                Sign up free
              </Link>
            </>
          )}
        </p>
      </div>
    )
  }

  // ── Render: OTP step ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <button
        onClick={() => { setStep('phone'); setOtp('') }}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Change number
      </button>

      {/* Info */}
      <p className="text-sm text-gray-600 text-center">
        We sent a 6-digit code to{' '}
        <span className="font-semibold text-gray-900">+91 {phone}</span>
      </p>

      {/* OTP boxes */}
      <OtpInput
        value={otp}
        onChange={setOtp}
        onComplete={handleVerifyOtp}
      />

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying…
        </div>
      )}

      {/* Manual verify button (in case auto-submit doesn't fire) */}
      {!loading && (
        <button
          onClick={() => handleVerifyOtp(otp)}
          disabled={otp.length < OTP_LENGTH || loading}
          className="flex items-center justify-center rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Verify OTP
        </button>
      )}

      {/* Resend */}
      <div className="text-center">
        {cooldown > 0 ? (
          <p className="text-sm text-gray-400">
            Resend OTP in{' '}
            <span className="font-semibold tabular-nums text-gray-600">{cooldown}s</span>
          </p>
        ) : (
          <button
            onClick={handleResend}
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
