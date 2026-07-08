'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, Briefcase } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'

// ─── Password rules ───────────────────────────────────────────────────────────

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
]

function isPasswordStrong(p: string) {
  return PASSWORD_RULES.every((r) => r.test(p))
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function isValidMobile(v: string) {
  return /^[6-9]\d{9}$/.test(v)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordFocused, setPasswordFocused] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!isValidEmail(email)) e.email = 'Enter a valid email address.'
    if (!isValidMobile(mobile)) e.mobile = 'Enter a valid 10-digit Indian mobile number.'
    if (!isPasswordStrong(password)) e.password = 'Password does not meet all requirements below.'
    if (!confirm) e.confirm = 'Please confirm your password.'
    else if (password !== confirm) e.confirm = 'Passwords do not match.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
      if (error) throw error

      const userId = data.user?.id
      if (userId) {
        await supabase.from('users').upsert({
          id: userId,
          phone: `+91${mobile}`,
          email: email.trim(),
          onboarding_complete: false,
        })
      }

      if (data.session) {
        // Email confirmation disabled — logged in immediately
        router.push('/onboarding/profile')
      } else {
        // Email confirmation required
        toast({ title: 'Almost there!', description: 'Check your email and click the link to verify your account.' })
        router.push('/login?verified=pending')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed.'
      toast({ title: 'Sign up failed', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  function clearError(field: string) {
    if (errors[field]) setErrors((e) => { const next = { ...e }; delete next[field]; return next })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900">CareerSetu</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1.5 text-sm text-gray-500">Start practising mock interviews for free</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError('email') }}
              className={`rounded-xl border-2 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
                errors.email ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mobile" className="text-sm font-medium text-gray-700">
              Mobile number <span className="text-red-500">*</span>
            </label>
            <div className={`flex rounded-xl border-2 overflow-hidden transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 ${
              errors.mobile ? 'border-red-400' : 'border-gray-200'
            }`}>
              <span className="flex items-center bg-gray-50 px-3.5 text-sm font-medium text-gray-500 border-r border-gray-200 select-none">
                +91
              </span>
              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={mobile}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setMobile(digits)
                  clearError('mobile')
                }}
                className="flex-1 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
            </div>
            {errors.mobile && <p className="text-xs text-red-600">{errors.mobile}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError('password') }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                className={`w-full rounded-xl border-2 px-3.5 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
                  errors.password ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password strength checklist */}
            {(passwordFocused || password.length > 0) && (
              <ul className="mt-1 flex flex-col gap-1">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(password)
                  return (
                    <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {rule.label}
                    </li>
                  )
                })}
              </ul>
            )}
            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="text-sm font-medium text-gray-700">
              Confirm password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); clearError('confirm') }}
                className={`w-full rounded-xl border-2 px-3.5 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
                  errors.confirm ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirm && <p className="text-xs text-red-600">{errors.confirm}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
