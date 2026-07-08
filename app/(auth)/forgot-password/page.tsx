'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import AuthLayout from '@/components/shared/AuthLayout'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { toast({ title: 'Email required', variant: 'destructive' }); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to send reset email.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send a reset link">
      {sent ? (
        <div className="flex flex-col gap-4 text-center">
          <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-4 text-sm text-green-700">
            A password reset link was sent to <span className="font-medium">{email}</span>. Check your inbox.
          </div>
          <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            ← Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
          <p className="text-center text-sm text-gray-500">
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">← Back to login</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
