'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, BarChart3, Mic, ListChecks, ChevronRight, TrendingUp, Award, CalendarDays } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/shared/Navbar'
import RadarChart, { RadarDatum } from '@/components/shared/RadarChart'
import LineChart, { LinePoint } from '@/components/shared/LineChart'
import {
  UNIFIED_DIMENSIONS, DIMENSION_LABELS,
  competencyScoresToDimensions, mcqResultToDimensions, aggregateDimensions,
} from '@/lib/dimensions'

interface HistoryItem {
  type: 'interview' | 'mcq'
  id: string
  title: string
  subtitle: string
  date: string
  scoreLabel: string
  href: string
}

interface Analytics {
  totalSessions: number
  thisWeek: number
  avgInterview: number | null
  bestLabel: string | null
  trend: LinePoint[]
  radar: RadarDatum[]
  strongest: string | null
  weakest: string | null
}

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'analytics' | 'history'>('analytics')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const userId = session.user.id

      const [{ data: interviews }, { data: tests }, { data: trackRows }, { data: companyRows }] = await Promise.all([
        supabase.from('sessions')
          .select('id, role, created_at, track_id')
          .eq('user_id', userId).eq('status', 'completed').order('created_at', { ascending: true }),
        supabase.from('mcq_tests')
          .select('id, score, num_questions, submitted_at, track_id, company_id')
          .eq('user_id', userId).eq('status', 'submitted').order('submitted_at', { ascending: true }),
        supabase.from('tracks').select('id, name, category'),
        supabase.from('companies').select('id, name'),
      ])

      const trackById = new Map((trackRows ?? []).map(t => [t.id as string, t as { name: string; category: string | null }]))
      const companyById = new Map((companyRows ?? []).map(c => [c.id as string, c.name as string]))

      // Feedback for the completed interviews
      const interviewIds = (interviews ?? []).map(s => s.id)
      const { data: feedbackRows } = interviewIds.length
        ? await supabase.from('session_feedback').select('session_id, overall_score, competency_scores').in('session_id', interviewIds)
        : { data: [] as { session_id: string; overall_score: number | null; competency_scores: Record<string, number> | null }[] }
      const fbBySession = new Map((feedbackRows ?? []).map(f => [f.session_id as string, f]))

      const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      const weekAgo = Date.now() - 7 * 864e5

      const contributions: Record<string, number>[] = []
      const trendRaw: { t: number; label: string; value: number }[] = []
      const hist: HistoryItem[] = []
      let interviewScoreSum = 0, interviewScoreCount = 0
      let best = -1, bestLabel: string | null = null

      for (const s of interviews ?? []) {
        const track = s.track_id ? trackById.get(s.track_id) ?? null : null
        const fb = fbBySession.get(s.id)
        const score = fb?.overall_score ?? null
        if (score != null) { interviewScoreSum += score; interviewScoreCount++; if (score > best) { best = score; bestLabel = `${score}/10 · ${track?.name ?? s.role}` } }
        if (fb?.competency_scores) contributions.push(competencyScoresToDimensions(fb.competency_scores))
        if (score != null) trendRaw.push({ t: new Date(s.created_at).getTime(), label: fmtDate(s.created_at), value: score })
        hist.push({
          type: 'interview', id: s.id, title: track?.name ?? s.role, subtitle: 'Mock interview',
          date: s.created_at, scoreLabel: score != null ? `${score}/10` : '—',
          href: `/interview/${s.id}/feedback`,
        })
      }

      for (const m of tests ?? []) {
        const track = m.track_id ? trackById.get(m.track_id) ?? null : null
        const companyName = m.company_id ? companyById.get(m.company_id) ?? null : null
        const percent = m.num_questions ? Math.round(((m.score ?? 0) / m.num_questions) * 100) : 0
        contributions.push(mcqResultToDimensions(track?.category, percent))
        if (m.submitted_at) trendRaw.push({ t: new Date(m.submitted_at).getTime(), label: fmtDate(m.submitted_at), value: percent / 10 })
        hist.push({
          type: 'mcq', id: m.id, title: track?.name ?? 'MCQ test',
          subtitle: companyName ? `MCQ · ${companyName}` : 'MCQ test',
          date: m.submitted_at ?? '', scoreLabel: `${percent}%`,
          href: `/test/${m.id}/result`,
        })
      }

      // History: newest first
      hist.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setHistory(hist)

      // Trend: chronological, last 12
      trendRaw.sort((a, b) => a.t - b.t)
      const trend: LinePoint[] = trendRaw.slice(-12).map(p => ({ label: p.label, value: p.value }))

      // Unified dimension scorecard
      const scorecard = aggregateDimensions(contributions)
      const radar: RadarDatum[] = UNIFIED_DIMENSIONS
        .filter(d => scorecard[d.key])
        .map(d => ({ label: d.label, value: Math.round(scorecard[d.key].value * 10) / 10 }))
      const scored = Object.entries(scorecard)
      const strongest = scored.length ? DIMENSION_LABELS[scored.reduce((a, b) => (b[1].value > a[1].value ? b : a))[0]] : null
      const weakest = scored.length ? DIMENSION_LABELS[scored.reduce((a, b) => (b[1].value < a[1].value ? b : a))[0]] : null

      const allDates = [...(interviews ?? []).map(s => s.created_at), ...(tests ?? []).map(m => m.submitted_at)].filter(Boolean) as string[]
      const thisWeek = allDates.filter(d => new Date(d).getTime() >= weekAgo).length

      setAnalytics({
        totalSessions: hist.length, thisWeek,
        avgInterview: interviewScoreCount ? Math.round((interviewScoreSum / interviewScoreCount) * 10) / 10 : null,
        bestLabel, trend, radar, strongest, weakest,
      })
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <>
        <Navbar isLoggedIn />
        <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
      </>
    )
  }

  const empty = history.length === 0

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Your practice history and performance trends.</p>
        </div>

        {empty ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
            <BarChart3 className="mx-auto h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-700">No analytics yet</p>
            <p className="mt-1 text-xs text-gray-400">Complete a mock interview or MCQ test and your trends will appear here.</p>
            <Link href="/practice" className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              Start practising <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
              {(['analytics', 'history'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t}
                </button>
              ))}
            </div>

            {tab === 'analytics' && analytics && (
              <div className="flex flex-col gap-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
                    <CalendarDays className="mx-auto h-4 w-4 text-indigo-400" />
                    <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.totalSessions}</p>
                    <p className="text-xs text-gray-400">Sessions</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
                    <TrendingUp className="mx-auto h-4 w-4 text-green-500" />
                    <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.avgInterview ?? '—'}</p>
                    <p className="text-xs text-gray-400">Avg interview</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
                    <Award className="mx-auto h-4 w-4 text-amber-400" />
                    <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.thisWeek}</p>
                    <p className="text-xs text-gray-400">This week</p>
                  </div>
                </div>

                {/* Trend */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-bold text-gray-800 mb-2">Score trend <span className="font-normal text-gray-400">(out of 10)</span></h2>
                  <LineChart data={analytics.trend} />
                </div>

                {/* Dimension radar */}
                {analytics.radar.length >= 3 ? (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-800 mb-2">Performance by area</h2>
                    <RadarChart data={analytics.radar} />
                    <div className="mt-3 flex flex-wrap gap-2 justify-center text-xs">
                      {analytics.strongest && <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">Strongest: {analytics.strongest}</span>}
                      {analytics.weakest && <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">Focus: {analytics.weakest}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-400 text-center">
                    Complete a few more sessions to unlock the performance radar.
                  </div>
                )}
              </div>
            )}

            {tab === 'history' && (
              <div className="flex flex-col gap-3">
                {history.map(h => (
                  <Link key={`${h.type}-${h.id}`} href={h.href}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-indigo-300 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${h.type === 'interview' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                        {h.type === 'interview' ? <Mic className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{h.title}</p>
                        <p className="text-xs text-gray-400">{h.subtitle} · {h.date ? new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-sm font-bold text-gray-700">{h.scoreLabel}</span>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
