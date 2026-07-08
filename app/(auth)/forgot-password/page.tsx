'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Briefcase, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isEmail(email)) {
      setEmailError('Enter a valid email address.')
      return
    }
    setEmailError('')
    setLoading(true)

    try {
      const redirectTo = `${window.location.origin}/auth/reset-password`
      await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      setSent(true)
    } catch {
      // Always show success to avoid email enumeration
      setSent(true)
    } finally {
      setLoading(false)
    }
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
        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Check your email</h1>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                If <span className="font-medium text-gray-700">{email}</span> is registered, we&apos;ve sent a password reset link. It may take a minute to arrive.
              </p>
            </div>
            <Link
              href="/login"
              className="mt-2 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-gray-900">Forgot your password?</h1>
              <p className="mt-1.5 text-sm text-gray-500">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
                  className={`rounded-xl border-2 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${emailError ? 'border-red-400' : 'border-gray-200'}`}
                />
                {emailError && <p className="text-xs text-red-600">{emailError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send reset link
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
