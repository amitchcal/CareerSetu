'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, Clock, Flag, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import Navbar from '@/components/shared/Navbar'

interface RunnerQuestion {
  testQuestionId: string
  position: number
  questionText: string
  options: string[]
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function TestRunnerPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.testId as string

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<RunnerQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [marked, setMarked] = useState<Set<string>>(new Set())
  const [current, setCurrent] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const deadlineRef = useRef<number>(0)
  const submittedRef = useRef(false)

  const submit = useCallback(async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    try {
      const res = await fetch(`/api/test/${testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      router.replace(`/test/${testId}/result`)
    } catch (err: unknown) {
      submittedRef.current = false
      setSubmitting(false)
      toast({ title: 'Submit failed', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' })
    }
  }, [answers, testId, router])

  // Load test (sessionStorage first, DB fallback)
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      let qs: RunnerQuestion[] = []
      let startedAt = 0
      let duration = 0

      const cached = sessionStorage.getItem(`mcqtest_${testId}`)
      if (cached) {
        const d = JSON.parse(cached)
        qs = d.questions
        startedAt = new Date(d.startedAt).getTime()
        duration = d.durationSeconds
      } else {
        const { data: test } = await supabase
          .from('mcq_tests').select('started_at, duration_seconds, status').eq('id', testId).single()
        if (!test) { router.replace('/practice'); return }
        if (test.status !== 'in_progress') { router.replace(`/test/${testId}/result`); return }
        startedAt = new Date(test.started_at).getTime()
        duration = test.duration_seconds
        const { data: tqs } = await supabase
          .from('mcq_test_questions')
          .select('id, position, questions(question_text, options)')
          .eq('test_id', testId).order('position', { ascending: true })
        qs = (tqs ?? []).map(tq => {
          const q = tq.questions as unknown as { question_text: string; options: string[] }
          return { testQuestionId: tq.id, position: tq.position, questionText: q.question_text, options: q.options }
        })
      }

      if (!qs.length) { router.replace('/practice'); return }
      deadlineRef.current = startedAt + duration * 1000
      setQuestions(qs)
      setRemaining(Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000)))
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId])

  // Countdown
  useEffect(() => {
    if (loading) return
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) { clearInterval(id); submit() }
    }, 1000)
    return () => clearInterval(id)
  }, [loading, submit])

  function selectOption(qid: string, idx: number) {
    setAnswers(a => ({ ...a, [qid]: idx }))
  }
  function toggleMark(qid: string) {
    setMarked(m => { const n = new Set(m); n.has(qid) ? n.delete(qid) : n.add(qid); return n })
  }

  if (loading || remaining === null) {
    return (
      <>
        <Navbar isLoggedIn />
        <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
      </>
    )
  }

  const q = questions[current]
  const answeredCount = Object.keys(answers).length
  const lowTime = remaining <= 60

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-5">
        {/* Header: progress + timer */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">MCQ test</p>
            <h1 className="text-lg font-bold text-gray-900">Question {current + 1} <span className="font-normal text-gray-400">of {questions.length}</span></h1>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${lowTime ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-700'}`}>
            <Clock className="h-4 w-4" />
            {fmt(remaining)}
          </div>
        </div>

        {/* Question palette */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-1.5">
            {questions.map((qq, i) => {
              const isAnswered = answers[qq.testQuestionId] !== undefined
              const isMarked = marked.has(qq.testQuestionId)
              const isCurrent = i === current
              return (
                <button
                  key={qq.testQuestionId}
                  onClick={() => setCurrent(i)}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent ? 'ring-2 ring-indigo-500 ' : ''
                  }${isAnswered ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {i + 1}
                  {isMarked && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-base font-medium text-gray-900 leading-relaxed">{q.questionText}</p>
          <ul className="mt-4 flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const selected = answers[q.testQuestionId] === i
              return (
                <li key={i}>
                  <button
                    onClick={() => selectOption(q.testQuestionId, i)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${
                      selected ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${selected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-300 text-gray-400'}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>

          <button
            onClick={() => toggleMark(q.testQuestionId)}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              marked.has(q.testQuestionId) ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Flag className="h-4 w-4" /> {marked.has(q.testQuestionId) ? 'Marked' : 'Mark'}
          </button>

          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Submit
            </button>
          )}
        </div>

        {/* Submit anytime */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">{answeredCount} of {questions.length} answered</p>
          <button onClick={submit} disabled={submitting} className="text-sm font-semibold text-green-700 hover:text-green-800 disabled:opacity-60">
            Submit test
          </button>
        </div>
      </main>
    </>
  )
}
