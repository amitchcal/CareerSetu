'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mic, TrendingUp, Trophy, X, ChevronRight, CalendarDays, Star, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/shared/Navbar'

const BANNER_DISMISSED_KEY = 'careersetu_upgrade_banner_dismissed'

interface DashboardData {
  name: string | null
  email: string | null
  avatarUrl: string | null
  targetRole: string | null
  plan: string
  completedCount: number
  avgScore: number | null
  recentSession: {
    id: string
    role: string
    createdAt: string
    score: number | null
  } | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [bannerDismissed, setBannerDismissed] = useState(true)

  useEffect(() => {
    setBannerDismissed(!!localStorage.getItem(BANNER_DISMISSED_KEY))
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const userId = session.user.id

      const [
        { data: user },
        { data: sessions },
        { data: subscription },
      ] = await Promise.all([
        supabase.from('users').select('name, email, target_role').eq('id', userId).maybeSingle(),
        supabase.from('sessions')
          .select('id, role, status, created_at, session_feedback(overall_score)')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('plan').eq('user_id', userId).maybeSingle(),
      ])

      const completed = sessions ?? []
      const scores = completed
        .map(s => (s.session_feedback as { overall_score: number | null }[] | null)?.[0]?.overall_score)
        .filter((s): s is number => s != null)
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

      const recent = completed[0] ?? null
      const recentScore = recent
        ? ((recent.session_feedback as { overall_score: number | null }[] | null)?.[0]?.overall_score ?? null)
        : null

      setData({
        name: user?.name ?? null,
        email: session.user.email ?? null,
        avatarUrl: session.user.user_metadata?.avatar_url ?? null,
        targetRole: user?.target_role ?? null,
        plan: subscription?.plan ?? 'free',
        completedCount: completed.length,
        avgScore,
        recentSession: recent
          ? { id: recent.id, role: recent.role, createdAt: recent.created_at, score: recentScore }
          : null,
      })
      setLoading(false)
    }
    load()
  }, [router])

  function dismissBanner() {
    localStorage.setItem(BANNER_DISMISSED_KEY, '1')
    setBannerDismissed(true)
  }

  if (loading) {
    return (
      <>
        <Navbar isLoggedIn />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      </>
    )
  }

  const firstName = data?.name?.split(' ')[0] ?? 'there'

  return (
    <>
      <Navbar
        isLoggedIn
        user={{
          name: data?.name ?? undefined,
          email: data?.email ?? undefined,
          avatarUrl: data?.avatarUrl ?? undefined,
        }}
      />
      <main className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">

        {/* Upgrade banner */}
        {data?.plan === 'free' && !bannerDismissed && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-800">
                You are on the <span className="font-semibold">Free plan</span> — upgrade for unlimited practice.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/pricing" className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-2">
                Upgrade
              </Link>
              <button onClick={dismissBanner} aria-label="Dismiss" className="rounded p-0.5 text-amber-500 hover:bg-amber-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hi {firstName}, ready to practise?</h1>
          {data?.targetRole && (
            <p className="mt-1 text-sm text-gray-500">Preparing for: {data.targetRole}</p>
          )}
        </div>

        {/* Primary CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Ready to practise?</p>
              <p className="text-xs text-indigo-200">Mock interviews, MCQ tests and coding — all in one place</p>
            </div>
          </div>
          <Link
            href="/practice"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98]"
          >
            Start practising
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sessions completed</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data?.completedCount ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Average score</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {data?.avgScore != null ? `${data.avgScore}/10` : '-'}
            </p>
          </div>
        </div>

        {/* Recent session */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Most recent session</h2>
          {data?.recentSession ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-gray-900">{data.recentSession.role}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(data.recentSession.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {data.recentSession.score != null && (
                  <div className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5">
                    <Star className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500" />
                    <span className="text-sm font-bold text-indigo-700">{data.recentSession.score}/10</span>
                  </div>
                )}
                <Link
                  href={`/interview/${data.recentSession.id}/feedback`}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
                >
                  View feedback
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
              <TrendingUp className="mx-auto h-8 w-8 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-700">No completed interviews yet</p>
              <p className="mt-1 text-xs text-gray-400">Start your first mock interview above — it takes about 10 minutes.</p>
            </div>
          )}
        </div>

      </main>
    </>
  )
}
