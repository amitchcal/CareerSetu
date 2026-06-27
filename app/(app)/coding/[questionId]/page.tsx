'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Play, Check, X, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import Navbar from '@/components/shared/Navbar'
import { CODE_LANGUAGES } from '@/lib/coderunner'

interface CodingQuestion {
  question_text: string
  difficulty: string
  starter_code: Record<string, string> | null
}
interface TestResult { index: number; passed: boolean; stdout: string; expected: string; stderr: string }

export default function CodingSolvePage() {
  const router = useRouter()
  const params = useParams()
  const questionId = params.questionId as string

  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState<CodingQuestion | null>(null)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [summary, setSummary] = useState<{ passed: number; total: number } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data } = await supabase
        .from('questions')
        .select('question_text, difficulty, starter_code')
        .eq('id', questionId)
        .single()
      if (!data) { router.replace('/coding'); return }
      const q = data as CodingQuestion
      setQuestion(q)
      const langs = q.starter_code ? Object.keys(q.starter_code) : ['python']
      const initial = langs.includes('python') ? 'python' : langs[0]
      setLanguage(initial)
      setCode(q.starter_code?.[initial] ?? '')
      setLoading(false)
    }
    load()
  }, [questionId, router])

  function switchLanguage(lang: string) {
    setLanguage(lang)
    setCode(question?.starter_code?.[lang] ?? '')
    setResults(null)
    setSummary(null)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.currentTarget
      const start = el.selectionStart, end = el.selectionEnd
      const next = code.slice(0, start) + '  ' + code.slice(end)
      setCode(next)
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 2 })
    }
  }

  async function run() {
    setRunning(true)
    setResults(null)
    setSummary(null)
    try {
      const res = await fetch('/api/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, language, sourceCode: code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Run failed.')
      setResults(data.results)
      setSummary({ passed: data.passed, total: data.total })
    } catch (err: unknown) {
      toast({ title: 'Run failed', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' })
    } finally {
      setRunning(false)
    }
  }

  if (loading || !question) {
    return (
      <>
        <Navbar isLoggedIn />
        <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
      </>
    )
  }

  const langKeys = question.starter_code ? Object.keys(question.starter_code) : ['python']
  const allPassed = summary && summary.passed === summary.total && summary.total > 0

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-5">
        <Link href="/coding" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 w-fit">
          <ChevronLeft className="h-4 w-4" /> All problems
        </Link>

        {/* Problem statement */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">{question.difficulty}</span>
          <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-gray-800 leading-relaxed">{question.question_text}</pre>
        </div>

        {/* Editor */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <div className="flex gap-1">
              {langKeys.map(l => (
                <button key={l} onClick={() => switchLanguage(l)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${language === l ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                  {CODE_LANGUAGES[l]?.label ?? l}
                </button>
              ))}
            </div>
            <button onClick={run} disabled={running}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-60">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? 'Running…' : 'Run'}
            </button>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            rows={14}
            className="w-full resize-y bg-gray-900 px-4 py-3 font-mono text-sm text-gray-100 outline-none"
            style={{ tabSize: 2 }}
          />
        </div>

        {/* Results */}
        {summary && (
          <div className={`rounded-2xl border-2 p-5 shadow-sm ${allPassed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center gap-2 mb-3">
              {allPassed ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-gray-400" />}
              <h2 className="text-sm font-bold text-gray-900">{summary.passed} / {summary.total} tests passed</h2>
            </div>
            <div className="flex flex-col gap-2">
              {(results ?? []).map(r => (
                <div key={r.index} className={`rounded-xl border p-3 text-sm ${r.passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
                  <div className="flex items-center gap-1.5 font-medium">
                    {r.passed ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                    Test {r.index} {r.passed ? 'passed' : 'failed'}
                  </div>
                  {!r.passed && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                      <div className="min-w-0"><span className="text-gray-400">Expected:</span><pre className="mt-0.5 whitespace-pre-wrap break-words rounded bg-white px-2 py-1 text-gray-700">{r.expected || '—'}</pre></div>
                      <div className="min-w-0"><span className="text-gray-400">Got:</span><pre className="mt-0.5 whitespace-pre-wrap break-words rounded bg-white px-2 py-1 text-gray-700">{r.stderr ? `⚠ ${r.stderr}` : (r.stdout || '—')}</pre></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
