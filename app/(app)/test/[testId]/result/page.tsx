'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Trophy, Check, X, MinusCircle, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/shared/Navbar'

interface ResultData {
  total: number
  correct: number
  incorrect: number
  skipped: number
  percent: number
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
        .from('mcq_tests').select('num_questions, score, status').eq('id', testId).single()
      if (!test) { router.replace('/practice'); return }

      const { data: tqs } = await supabase
        .from('mcq_test_questions').select('user_answer, is_correct').eq('test_id', testId)
      const rows = tqs ?? []
      const total = test.num_questions
      const correct = test.score ?? rows.filter(r => r.is_correct).length
      const answered = rows.filter(r => r.user_answer !== null).length
      const incorrect = answered - correct
      const skipped = total - answered
      setData({ total, correct, incorrect, skipped, percent: total ? Math.round((correct / total) * 100) : 0 })
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

  const tone = data.percent >= 70 ? 'text-green-600' : data.percent >= 40 ? 'text-amber-600' : 'text-red-600'

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test result</h1>
          <p className="mt-1 text-sm text-gray-500">Here is how you did.</p>
        </div>

        {/* Score */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm flex flex-col items-center gap-2">
          <Trophy className="h-8 w-8 text-amber-400" />
          <p className={`text-5xl font-bold ${tone}`}>{data.percent}%</p>
          <p className="text-sm text-gray-500">{data.correct} of {data.total} correct</p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <Check className="mx-auto h-5 w-5 text-green-500" />
            <p className="mt-1 text-2xl font-bold text-gray-900">{data.correct}</p>
            <p className="text-xs text-gray-400">Correct</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <X className="mx-auto h-5 w-5 text-red-500" />
            <p className="mt-1 text-2xl font-bold text-gray-900">{data.incorrect}</p>
            <p className="text-xs text-gray-400">Incorrect</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <MinusCircle className="mx-auto h-5 w-5 text-gray-400" />
            <p className="mt-1 text-2xl font-bold text-gray-900">{data.skipped}</p>
            <p className="text-xs text-gray-400">Skipped</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">A topic-wise breakdown and question review are coming soon.</p>

        <div className="flex gap-3">
          <Link href="/test/new" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            <RotateCcw className="h-4 w-4" /> New test
          </Link>
          <Link href="/practice" className="flex flex-1 items-center justify-center rounded-xl border-2 border-gray-200 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Back to Practice
          </Link>
        </div>
      </main>
    </>
  )
}
