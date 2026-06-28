'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ListChecks, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import Navbar from '@/components/shared/Navbar'

interface TrackOpt { id: string; name: string; parent_id: string | null; sort_order: number }
interface CompanyOpt { id: string; name: string }

const DIFFICULTIES = ['fresher', 'intermediate', 'experienced']
const ROUNDS = [
  { value: '', label: 'Any' },
  { value: 'technical', label: 'Technical' },
  { value: 'aptitude', label: 'Aptitude' },
  { value: 'domain', label: 'Domain' },
]
const LENGTHS = [
  { value: 10, label: '10 questions', sub: '~10 min' },
  { value: 20, label: '20 questions', sub: '~20 min' },
  { value: 30, label: '30 questions', sub: '~30 min' },
]

export default function TestNewPage() {
  const router = useRouter()
  const [authLoading, setAuthLoading] = useState(true)
  const [tracks, setTracks] = useState<TrackOpt[]>([])
  const [companies, setCompanies] = useState<CompanyOpt[]>([])

  const [trackId, setTrackId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [roundType, setRoundType] = useState('')
  const [difficulty, setDifficulty] = useState('fresher')
  const [length, setLength] = useState(10)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const [{ data: tk }, { data: co }] = await Promise.all([
        supabase.from('tracks').select('id, name, parent_id, sort_order').eq('is_active', true).order('sort_order'),
        supabase.from('companies').select('id, name').order('sort_order'),
      ])
      const t = (tk as TrackOpt[]) ?? []
      setTracks(t)
      if (t.length) setTrackId(t[0].id)
      setCompanies((co as CompanyOpt[]) ?? [])
      setAuthLoading(false)
    }
    init()
  }, [router])

  async function handleStart() {
    if (!trackId) return
    setStarting(true)
    try {
      const res = await fetch('/api/test/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, companyId: companyId || null, roundType: roundType || null, difficulty, length }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not start test.')
      // Hand the question set to the runner without exposing correct answers via a refetch
      sessionStorage.setItem(`mcqtest_${data.testId}`, JSON.stringify(data))
      router.push(`/test/${data.testId}`)
    } catch (err: unknown) {
      toast({ title: 'Could not start', description: err instanceof Error ? err.message : 'Something went wrong.', variant: 'destructive' })
      setStarting(false)
    }
  }

  const selectClass = 'w-full rounded-xl border-2 border-gray-200 px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500'

  if (authLoading) {
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
      <main className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><ListChecks className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MCQ test</h1>
            <p className="text-sm text-gray-500">Time-bound, auto-graded.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              Track
              <select value={trackId} onChange={e => setTrackId(e.target.value)} className={selectClass}>
                {tracks.map(t => <option key={t.id} value={t.id}>{t.parent_id ? `— ${t.name}` : t.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              Company (optional)
              <select value={companyId} onChange={e => setCompanyId(e.target.value)} className={selectClass}>
                <option value="">Company-neutral</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              Round type
              <select value={roundType} onChange={e => setRoundType(e.target.value)} className={selectClass}>
                {ROUNDS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              Difficulty
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={`${selectClass} capitalize`}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Length</span>
            <div className="grid grid-cols-3 gap-2">
              {LENGTHS.map(l => (
                <label key={l.value} className={`flex cursor-pointer flex-col items-center rounded-xl border-2 px-2 py-3 text-center transition-all ${length === l.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="length" checked={length === l.value} onChange={() => setLength(l.value)} className="sr-only" />
                  <span className={`text-sm font-semibold ${length === l.value ? 'text-indigo-700' : 'text-gray-900'}`}>{l.value}</span>
                  <span className="text-xs text-gray-400">{l.sub}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-start gap-2 text-sm text-amber-700">
          <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          <span>The timer starts as soon as you begin. If fewer approved questions are available, the test uses what exists.</span>
        </div>

        <button
          onClick={handleStart}
          disabled={starting || !trackId}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
        >
          {starting && <Loader2 className="h-4 w-4 animate-spin" />}
          {starting ? 'Starting…' : 'Start test'}
        </button>
      </main>
    </>
  )
}
