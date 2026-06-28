'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, TrendingUp, TrendingDown, MessageSquare, ChevronRight, Download, Gauge, AudioLines, Video } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/shared/Navbar'
import ResumeInsightsPanel from '@/components/shared/ResumeInsightsPanel'
import RadarChart, { RadarDatum } from '@/components/shared/RadarChart'
import { COMPETENCY_LABELS } from '@/lib/competencies'
import { pace } from '@/lib/delivery'

interface Delivery {
  avgWpm: number | null
  totalFillers: number
  breakdown: [string, number][]
}

interface Feedback {
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  perQuestionFeedback: { questionNumber: number; feedback: string }[]
  competencyScores: Record<string, number>
}

const SELECT = 'overall_score, strengths, weaknesses, per_question_feedback, competency_scores'

function mapFeedback(fb: Record<string, unknown>): Feedback {
  return {
    overallScore: (fb.overall_score as number) ?? 0,
    strengths: (fb.strengths as string[]) ?? [],
    weaknesses: (fb.weaknesses as string[]) ?? [],
    perQuestionFeedback: (fb.per_question_feedback as { questionNumber: number; feedback: string }[]) ?? [],
    competencyScores: (fb.competency_scores as Record<string, number>) ?? {},
  }
}

export default function VideoFeedbackPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [role, setRole] = useState<string>('')
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    async function load() {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) { router.replace('/login'); return }

      const [{ data: sess }, { data: fb }, { data: sq }] = await Promise.all([
        supabase.from('sessions').select('role').eq('id', sessionId).single(),
        supabase.from('session_feedback').select(SELECT).eq('session_id', sessionId).maybeSingle(),
        supabase.from('session_questions').select('words_per_minute, filler_count, filler_words').eq('session_id', sessionId),
      ])
      if (sess) setRole(sess.role)

      const rows = sq ?? []
      const wpms = rows.map(r => r.words_per_minute as number | null).filter((n): n is number => typeof n === 'number' && n > 0)
      const combined: Record<string, number> = {}
      let totalFillers = 0
      for (const r of rows) {
        totalFillers += (r.filler_count as number) ?? 0
        const fw = (r.filler_words as Record<string, number> | null) ?? {}
        for (const [k, v] of Object.entries(fw)) combined[k] = (combined[k] ?? 0) + v
      }
      const breakdown = Object.entries(combined).sort((a, b) => b[1] - a[1]).slice(0, 5)
      if (wpms.length || totalFillers > 0) {
        setDelivery({
          avgWpm: wpms.length ? Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length) : null,
          totalFillers,
          breakdown,
        })
      }

      if (fb) {
        setFeedback(mapFeedback(fb))
        setLoading(false)
      } else {
        interval = setInterval(async () => {
          const { data: poll } = await supabase.from('session_feedback').select(SELECT).eq('session_id', sessionId).maybeSingle()
          if (poll) {
            clearInterval(interval)
            setFeedback(mapFeedback(poll))
            setLoading(false)
          }
        }, 3000)
      }
    }
    load()
    return () => { if (interval) clearInterval(interval) }
  }, [sessionId, router])

  const scoreColor = (s: number) => (s >= 8 ? 'text-green-600' : s >= 6 ? 'text-amber-500' : 'text-red-500')
  const ringColor = (s: number) => (s >= 8 ? '#16a34a' : s >= 6 ? '#f59e0b' : '#ef4444')

  const radarData: RadarDatum[] = feedback
    ? Object.entries(feedback.competencyScores).map(([k, v]) => ({ label: COMPETENCY_LABELS[k] ?? k, value: v }))
    : []

  const gaugeR = 52
  const circ = 2 * Math.PI * gaugeR
  const pct = feedback ? feedback.overallScore / 10 : 0

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-xl px-4 py-8 flex flex-col gap-6 print:max-w-full">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Video className="h-3.5 w-3.5 text-indigo-400" />
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{role}</p>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Video interview feedback</h1>
          </div>
          {!loading && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors print:hidden"
            >
              <Download className="h-4 w-4" /> PDF
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-gray-500">Analysing your answers with AI…<br />This usually takes 10–20 seconds.</p>
          </div>
        ) : (
          <>
            {/* Score gauge + radar */}
            <div className="rounded-2xl border-2 border-indigo-100 bg-white p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
              <div className="relative shrink-0">
                <svg viewBox="0 0 130 130" className="h-32 w-32 -rotate-90">
                  <circle cx="65" cy="65" r={gaugeR} fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle cx="65" cy="65" r={gaugeR} fill="none" stroke={ringColor(feedback!.overallScore)} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-extrabold ${scoreColor(feedback!.overallScore)}`}>{feedback!.overallScore}</span>
                  <span className="text-xs text-gray-400">/ 10</span>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <p className="font-semibold text-gray-900 text-sm mb-0.5">Overall score</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {feedback!.overallScore >= 8
                    ? 'Strong performance — you demonstrated solid interview skills.'
                    : feedback!.overallScore >= 6
                    ? 'Good effort. A few areas to tighten before the real interview.'
                    : 'Needs work. Focus on the areas to improve below and practise more.'}
                </p>
              </div>
            </div>

            {/* Competency radar */}
            {radarData.length >= 3 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 mb-2">Competency breakdown</h2>
                <RadarChart data={radarData} />
              </div>
            )}

            {/* Delivery metrics */}
            {delivery && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AudioLines className="h-4 w-4 text-indigo-500" />
                  <h2 className="text-sm font-bold text-gray-800">Delivery (measured)</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><Gauge className="h-3.5 w-3.5" /> Speaking pace</div>
                    {delivery.avgWpm != null ? (
                      <>
                        <p className="text-2xl font-bold text-gray-900">{delivery.avgWpm} <span className="text-sm font-normal text-gray-400">wpm</span></p>
                        {(() => {
                          const p = pace(delivery.avgWpm)
                          const map = { slow: ['Bit slow', 'text-amber-600'], good: ['Good pace', 'text-green-600'], fast: ['Bit fast', 'text-amber-600'] } as const
                          return p ? <p className={`text-xs font-medium ${map[p][1]}`}>{map[p][0]} · aim 110–160</p> : null
                        })()}
                      </>
                    ) : <p className="text-sm text-gray-400">Not available</p>}
                  </div>
                  <div className="rounded-xl bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><MessageSquare className="h-3.5 w-3.5" /> Filler words</div>
                    <p className="text-2xl font-bold text-gray-900">{delivery.totalFillers}</p>
                    {delivery.breakdown.length > 0 && (
                      <p className="text-xs text-gray-500 truncate">{delivery.breakdown.map(([w, n]) => `${w} ×${n}`).join(', ')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Strengths */}
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h2 className="text-sm font-bold text-green-800">What went well</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {feedback!.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />{s}
                  </li>
                ))}
                {feedback!.strengths.length === 0 && <li className="text-sm text-green-700/70">No clear strengths identified this time.</li>}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-bold text-amber-800">Areas to improve</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {feedback!.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />{w}
                  </li>
                ))}
              </ul>
            </div>

            {/* Per-question feedback */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-800">Question-by-question feedback</h2>
              </div>
              <div className="flex flex-col gap-3">
                {feedback!.perQuestionFeedback.map((q) => (
                  <div key={q.questionNumber} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold text-indigo-500 mb-1">Question {q.questionNumber}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{q.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resume Insights */}
            <ResumeInsightsPanel sessionId={sessionId} role={role} />

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden">
              <Link href="/video-interview/new" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                Practise again <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="flex flex-1 items-center justify-center rounded-xl border-2 border-gray-200 px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Back to dashboard
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  )
}
