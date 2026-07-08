'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, Briefcase } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function isMobile(v: string) {
  return /^[6-9]\d{9}$/.test(v.replace(/\s/g, ''))
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (searchParams.get('verified') === 'pending') {
      toast({ title: 'Check your email', description: 'Click the verification link before logging in.' })
    }
  }, [searchParams])

  function validate() {
    const e: Record<string, string> = {}
    if (!identifier.trim()) {
      e.identifier = 'Enter your email or mobile number.'
    } else if (!isEmail(identifier) && !isMobile(identifier)) {
      e.identifier = 'Enter a valid email address or 10-digit mobile number.'
    }
    if (!password) e.password = 'Enter your password.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function resolveEmail(): Promise<string | null> {
    const v = identifier.trim()
    if (isEmail(v)) return v
    const mobile = v.replace(/\s/g, '')
    const { data } = await supabase
      .from('users')
      .select('email')
      .or(`phone.eq.+91${mobile},phone.eq.${mobile}`)
      .maybeSingle()
    return data?.email ?? null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const email = await resolveEmail()
      if (!email) {
        setErrors({ identifier: 'No account found with this mobile number.' })
        return
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const userId = data.user?.id
      if (!userId) throw new Error('Login failed.')
      const { data: user } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', userId)
        .maybeSingle()
      router.push(user?.onboarding_complete ? '/dashboard' : '/onboarding/profile')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed.'
      const friendly = message.includes('Invalid login credentials')
        ? 'Incorrect email/mobile or password.'
        : message
      toast({ title: 'Login failed', description: friendly, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  function clearError(field: string) {
    if (errors[field]) setErrors((e) => { const next = { ...e }; delete next[field]; return next })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900">CareerSetu</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-gray-500">Sign in to continue practising</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="identifier" className="text-sm font-medium text-gray-700">
              Email or mobile number
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="you@example.com or 9876543210"
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); clearError('identifier') }}
              className={`rounded-xl border-2 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${errors.identifier ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.identifier && <p className="text-xs text-red-600">{errors.identifier}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <Link href="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError('password') }}
                className={`w-full rounded-xl border-2 px-3.5 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>

          <p className="text-center text-sm text-gray-500">
            New to CareerSetu?{' '}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">Sign up free</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
