'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Trophy, Check, X, MinusCircle, RotateCcw, Clock, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/shared/Navbar'

interface ReviewQuestion {
  position: number
  question_text: string
  options: string[]
  correct_option: number
  explanation: string | null
  tags: string[]
  user_answer: number | null
  is_correct: boolean | null
  time_spent_seconds: number | null
}
interface TopicStat { tag: string; correct: number; total: number }
interface ResultData {
  total: number
  correct: number
  incorrect: number
  skipped: number
  percent: number
  totalTimeSec: number
  avgTimeSec: number
  topics: TopicStat[]
  weakTopics: string[]
  review: ReviewQuestion[]
}

function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}
function pctTone(p: number): string {
  return p >= 70 ? 'text-green-600' : p >= 40 ? 'text-amber-600' : 'text-red-600'
}
function barTone(p: number): string {
  return p >= 70 ? 'bg-green-500' : p >= 40 ? 'bg-amber-500' : 'bg-red-500'
}

export default function TestResultPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.testId as string
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ResultData | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const { data: test } = await supabase
        .from('mcq_tests')
        .select('num_questions, score, started_at, submitted_at')
        .eq('id', testId).single()
      if (!test) { router.replace('/practice'); return }

      const { data: tqs } = await supabase
        .from('mcq_test_questions')
        .select('position, user_answer, is_correct, time_spent_seconds, questions(question_text, options, correct_option, explanation, tags)')
        .eq('test_id', testId)
        .order('position', { ascending: true })

      const review: ReviewQuestion[] = (tqs ?? []).map(tq => {
        const q = tq.questions as unknown as { question_text: string; options: string[]; correct_option: number; explanation: string | null; tags: string[] | null }
        return {
          position: tq.position,
          question_text: q.question_text,
          options: q.options ?? [],
          correct_option: q.correct_option,
          explanation: q.explanation,
          tags: q.tags ?? [],
          user_answer: tq.user_answer,
          is_correct: tq.is_correct,
          time_spent_seconds: tq.time_spent_seconds,
        }
      })

      const total = test.num_questions
      const correct = test.score ?? review.filter(r => r.is_correct).length
      const answered = review.filter(r => r.user_answer !== null).length
      const incorrect = answered - correct
      const skipped = total - answered

      // Topic-wise accuracy from tags
      const topicMap = new Map<string, TopicStat>()
      for (const r of review) {
        for (const tag of r.tags) {
          const t = topicMap.get(tag) ?? { tag, correct: 0, total: 0 }
          t.total += 1
          if (r.is_correct) t.correct += 1
          topicMap.set(tag, t)
        }
      }
      const topics = Array.from(topicMap.values()).sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
      const weakTopics = topics.filter(t => t.correct / t.total < 0.5).map(t => t.tag)

      // Time analysis
      let totalTimeSec = 0
      if (test.started_at && test.submitted_at) {
        totalTimeSec = Math.max(0, Math.round((new Date(test.submitted_at).getTime() - new Date(test.started_at).getTime()) / 1000))
      } else {
        totalTimeSec = review.reduce((a, r) => a + (r.time_spent_seconds ?? 0), 0)
      }
      const avgTimeSec = total ? Math.round(totalTimeSec / total) : 0

      setData({
        total, correct, incorrect, skipped,
        percent: total ? Math.round((correct / total) * 100) : 0,
        totalTimeSec, avgTimeSec, topics, weakTopics, review,
      })
      setLoading(false)
    }
    load()
  }, [testId, router])

  if (loading || !data) {
    return (
      <>
        <Navbar isLoggedIn />
        <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
      </>
    )
  }

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test result</h1>
          <p className="mt-1 text-sm text-gray-500">Here is how you did, with a breakdown by topic.</p>
        </div>

        {/* Score */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm flex flex-col items-center gap-2">
          <Trophy className="h-8 w-8 text-amber-400" />
          <p className={`text-5xl font-bold ${pctTone(data.percent)}`}>{data.percent}%</p>
          <p className="text-sm text-gray-500">{data.correct} of {data.total} correct</p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Check className="mx-auto h-5 w-5 text-green-500" />, val: data.correct, label: 'Correct' },
            { icon: <X className="mx-auto h-5 w-5 text-red-500" />, val: data.incorrect, label: 'Incorrect' },
            { icon: <MinusCircle className="mx-auto h-5 w-5 text-gray-400" />, val: data.skipped, label: 'Skipped' },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
              {c.icon}
              <p className="mt-1 text-2xl font-bold text-gray-900">{c.val}</p>
              <p className="text-xs text-gray-400">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Time analysis */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex items-center justify-around">
          <div className="flex flex-col items-center gap-0.5">
            <Clock className="h-4 w-4 text-indigo-400" />
            <p className="text-lg font-bold text-gray-900">{fmtClock(data.totalTimeSec)}</p>
            <p className="text-xs text-gray-400">Total time</p>
          </div>
          <div className="h-10 w-px bg-gray-100" />
          <div className="flex flex-col items-center gap-0.5">
            <Clock className="h-4 w-4 text-indigo-400" />
            <p className="text-lg font-bold text-gray-900">{fmtClock(data.avgTimeSec)}</p>
            <p className="text-xs text-gray-400">Avg / question</p>
          </div>
        </div>

        {/* Topic-wise accuracy */}
        {data.topics.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700">
              <Tag className="h-4 w-4 text-gray-400" /> Topic-wise accuracy
            </div>
            <div className="flex flex-col gap-3">
              {data.topics.map(t => {
                const p = Math.round((t.correct / t.total) * 100)
                return (
                  <div key={t.tag}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 capitalize">{t.tag}</span>
                      <span className={`text-xs font-semibold ${pctTone(p)}`}>{t.correct}/{t.total} · {p}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${barTone(p)}`} style={{ width: `${p}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Per-question review */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-700">Question review</h2>
          {data.review.map(r => {
            const skipped = r.user_answer === null
            return (
              <div key={r.position} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-2 mb-3">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    r.is_correct ? 'bg-green-100 text-green-700' : skipped ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'
                  }`}>
                    {r.is_correct ? <Check className="h-3 w-3" /> : skipped ? '–' : <X className="h-3 w-3" />}
                  </span>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">{r.position}. {r.question_text}</p>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {r.options.map((opt, i) => {
                    const isCorrect = i === r.correct_option
                    const isUser = i === r.user_answer
                    return (
                      <li key={i} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
                        isCorrect ? 'bg-green-50 text-green-800 font-medium'
                          : isUser ? 'bg-red-50 text-red-800'
                          : 'text-gray-600'
                      }`}>
                        {isCorrect ? <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                          : isUser ? <X className="h-3.5 w-3.5 text-red-600 shrink-0" />
                          : <span className="h-3.5 w-3.5 shrink-0" />}
                        {opt}
                        {isUser && !isCorrect && <span className="ml-auto text-xs text-red-500">your answer</span>}
                      </li>
                    )
                  })}
                </ul>
                {r.explanation && (
                  <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-600">Why: </span>{r.explanation}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          {data.weakTopics.length > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span className="font-semibold">Focus areas: </span>
              <span className="capitalize">{data.weakTopics.join(', ')}</span>. Try another test to strengthen these.
            </div>
          )}
          <div className="flex gap-3">
            <Link href="/test/new" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              <RotateCcw className="h-4 w-4" /> New test
            </Link>
            <Link href="/practice" className="flex flex-1 items-center justify-center rounded-xl border-2 border-gray-200 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Back to Practice
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
