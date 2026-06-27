'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Sparkles, ArrowRight, Star, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'

const ROLES = ['Software Engineer', 'Sales & Marketing', 'HR / Behavioural', 'SSC / Bank PO']

interface DemoFeedback { score: number; summary: string; strength: string; improvement: string }
type Step = 'choose' | 'answer' | 'result'

export default function TryDemoPage() {
  const [step, setStep] = useState<Step>('choose')
  const [role, setRole] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<DemoFeedback | null>(null)
  const [loadingQ, setLoadingQ] = useState(false)
  const [loadingF, setLoadingF] = useState(false)
  const [error, setError] = useState('')

  async function pickRole(r: string) {
    setRole(r); setError(''); setLoadingQ(true); setStep('answer')
    try {
      const res = await fetch('/api/demo/question', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: r }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuestion(data.question)
    } catch {
      setError('Could not load a question. Please try again.')
    } finally { setLoadingQ(false) }
  }

  async function submitAnswer() {
    if (answer.trim().length < 10) { setError('Write a little more to get useful feedback.'); return }
    setError(''); setLoadingF(true)
    try {
      const res = await fetch('/api/demo/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, question, answer }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFeedback(data)
      setStep('result')
    } catch {
      setError('Could not analyse your answer. Please try again.')
    } finally { setLoadingF(false) }
  }

  function reset() {
    setStep('choose'); setRole(''); setQuestion(''); setAnswer(''); setFeedback(null); setError('')
  }

  const scoreColor = (s: number) => (s >= 8 ? 'text-green-600' : s >= 6 ? 'text-amber-500' : 'text-red-500')

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-10 flex flex-col gap-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Free demo · no signup
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Try one interview question</h1>
          <p className="mt-2 text-sm text-gray-500">Answer one question and get instant AI feedback. No account needed.</p>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {/* Step 1: choose role */}
        {step === 'choose' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-3">Pick a role to practise:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLES.map(r => (
                <button key={r} onClick={() => pickRole(r)}
                  className="flex items-center justify-between rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                  {r} <ArrowRight className="h-4 w-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: answer */}
        {step === 'answer' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{role}</p>
              {loadingQ ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Generating a question…</div>
              ) : (
                <p className="text-base font-semibold text-gray-900 leading-relaxed">{question}</p>
              )}
            </div>
            {!loadingQ && (
              <>
                <textarea
                  rows={6} value={answer} onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer here…"
                  className="rounded-xl border-2 border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
                <button onClick={submitAnswer} disabled={loadingF}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {loadingF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loadingF ? 'Analysing…' : 'Get instant feedback'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 3: result */}
        {step === 'result' && feedback && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border-2 border-indigo-100 bg-white p-6 shadow-sm flex items-center gap-5">
              <div className="flex flex-col items-center shrink-0">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400 mb-1" />
                <span className={`text-4xl font-extrabold ${scoreColor(feedback.score)}`}>{feedback.score}</span>
                <span className="text-xs text-gray-400">/ 10</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{feedback.summary}</p>
            </div>
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-1 text-sm font-bold text-green-800"><TrendingUp className="h-4 w-4" /> What went well</div>
              <p className="text-sm text-green-800">{feedback.strength}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-1 text-sm font-bold text-amber-800"><TrendingDown className="h-4 w-4" /> To improve</div>
              <p className="text-sm text-amber-800">{feedback.improvement}</p>
            </div>

            {/* Conversion CTA */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-center shadow-md">
              <p className="font-semibold text-white">That was one question. The full app gives you so much more.</p>
              <p className="mt-1 text-xs text-indigo-200">Voice interviews, company-specific questions, competency scoring, MCQ tests, coding practice and progress tracking.</p>
              <Link href="/signup" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <button onClick={reset} className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
              <RefreshCw className="h-4 w-4" /> Try another question
            </button>
          </div>
        )}
      </main>
    </>
  )
}
