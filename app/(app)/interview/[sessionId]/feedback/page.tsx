'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Star, TrendingUp, TrendingDown, MessageSquare, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/shared/Navbar'

interface Feedback {
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  perQuestionFeedback: { questionNumber: number; feedback: string }[]
}

interface SessionInfo {
  role: string
  difficulty: string
}

export default function FeedbackPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) { router.replace('/login'); return }

      const [{ data: sess }, { data: fb }] = await Promise.all([
        supabase.from('sessions').select('role, difficulty').eq('id', sessionId).single(),
        supabase.from('session_feedback').select('overall_score, strengths, weaknesses, per_question_feedback').eq('session_id', sessionId).maybeSingle(),
      ])

      if (sess) setSession({ role: sess.role, difficulty: sess.difficulty })

      if (fb) {
        setFeedback({
          overallScore: fb.overall_score ?? 0,
          strengths: (fb.strengths as string[]) ?? [],
          weaknesses: (fb.weaknesses as string[]) ?? [],
          perQuestionFeedback: (fb.per_question_feedback as { questionNumber: number; feedback: string }[]) ?? [],
        })
        setLoading(false)
      } else {
        // Feedback not ready yet — poll every 3s
        const interval = setInterval(async () => {
          const { data: fbPoll } = await supabase
            .from('session_feedback')
            .select('overall_score, strengths, weaknesses, per_question_feedback')
            .eq('session_id', sessionId)
            .maybeSingle()

          if (fbPoll) {
            clearInterval(interval)
            setFeedback({
              overallScore: fbPoll.overall_score ?? 0,
              strengths: (fbPoll.strengths as string[]) ?? [],
              weaknesses: (fbPoll.weaknesses as string[]) ?? [],
              perQuestionFeedback: (fbPoll.per_question_feedback as { questionNumber: number; feedback: string }[]) ?? [],
            })
            setLoading(false)
          }
        }, 3000)
        return () => clearInterval(interval)
      }
    }
    load()
  }, [sessionId, router])

  const scoreColor = (s: number) =>
    s >= 8 ? 'text-green-600' : s >= 6 ? 'text-amber-500' : 'text-red-500'

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-xl px-4 py-8 flex flex-col gap-6">

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{session?.role}</p>
          <h1 className="text-2xl font-bold text-gray-900">Interview Feedback</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-gray-500">Analysing your answers with AI…<br />This usually takes 10–20 seconds.</p>
          </div>
        ) : (
          <>
            {/* Score card */}
            <div className="rounded-2xl border-2 border-indigo-100 bg-white p-6 shadow-sm flex items-center gap-6">
              <div className="flex flex-col items-center shrink-0">
                <Star className="h-6 w-6 text-amber-400 fill-amber-400 mb-1" />
                <span className={`text-5xl font-extrabold ${scoreColor(feedback!.overallScore)}`}>{feedback!.overallScore}</span>
                <span className="text-xs text-gray-400">/ 10</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-0.5">Overall Score</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {feedback!.overallScore >= 8
                    ? 'Excellent performance! You demonstrated strong interview skills.'
                    : feedback!.overallScore >= 6
                    ? 'Good effort. A few areas to tighten before the real interview.'
                    : 'Needs improvement. Focus on the weaknesses below and practise more.'}
                </p>
              </div>
            </div>

            {/* Strengths */}
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h2 className="text-sm font-bold text-green-800">Strengths</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {feedback!.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-bold text-amber-800">Areas to Improve</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {feedback!.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            {/* Per-question feedback */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-800">Question-by-Question Feedback</h2>
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

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/interview/new"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Practice Again
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="flex flex-1 items-center justify-center rounded-xl border-2 border-gray-200 px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  )
}
