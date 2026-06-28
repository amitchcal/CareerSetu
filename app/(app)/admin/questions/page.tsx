'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, Check, X, ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import Navbar from '@/components/shared/Navbar'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

const ROUND_TYPES = ['technical', 'hr', 'managerial', 'aptitude', 'domain']
const DIFFICULTIES = ['fresher', 'intermediate', 'experienced']
const FORMATS = ['mcq', 'interview']

interface TrackOpt { id: string; name: string; parent_id: string | null; sort_order: number }
interface CompanyOpt { id: string; name: string }
interface DraftQuestion {
  id: string
  format: string
  round_type: string
  difficulty: string
  question_text: string
  options: string[] | null
  correct_option: number | null
  explanation: string | null
  tags: string[] | null
  source_note: string | null
  tracks: { name: string } | null
  companies: { name: string } | null
}

export default function AdminQuestionsPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [tracks, setTracks] = useState<TrackOpt[]>([])
  const [companies, setCompanies] = useState<CompanyOpt[]>([])
  const [drafts, setDrafts] = useState<DraftQuestion[]>([])
  const [loadingDrafts, setLoadingDrafts] = useState(true)

  const [trackId, setTrackId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [roundType, setRoundType] = useState('technical')
  const [difficulty, setDifficulty] = useState('fresher')
  const [format, setFormat] = useState('mcq')
  const [count, setCount] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }
      setIsAdmin(ADMIN_EMAILS.includes((session.user.email ?? '').toLowerCase()))
      setAuthChecked(true)
    })
  }, [router])

  const loadDrafts = useCallback(async () => {
    setLoadingDrafts(true)
    const { data } = await supabase
      .from('questions')
      .select('id, format, round_type, difficulty, question_text, options, correct_option, explanation, tags, source_note, tracks(name), companies(name)')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(200)
    setDrafts((data as unknown as DraftQuestion[]) ?? [])
    setLoadingDrafts(false)
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    supabase.from('tracks').select('id, name, parent_id, sort_order').eq('is_active', true)
      .order('sort_order').then(({ data }) => {
        const t = (data as TrackOpt[]) ?? []
        setTracks(t)
        if (t.length && !trackId) setTrackId(t[0].id)
      })
    supabase.from('companies').select('id, name').order('sort_order')
      .then(({ data }) => setCompanies((data as CompanyOpt[]) ?? []))
    loadDrafts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  async function handleGenerate() {
    if (!trackId) return
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, companyId: companyId || null, roundType, difficulty, format, count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed.')
      toast({ title: 'Generated', description: `${data.generated} draft question(s) created.` })
      await loadDrafts()
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed.', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  async function review(id: string, action: 'approve' | 'reject') {
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/questions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setDrafts(d => d.filter(q => q.id !== id))
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed.', variant: 'destructive' })
    } finally {
      setBusyId(null)
    }
  }

  if (!authChecked) {
    return (
      <>
        <Navbar isLoggedIn />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      </>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <Navbar isLoggedIn />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-gray-300" />
          <h1 className="mt-4 text-lg font-bold text-gray-900">Admins only</h1>
          <p className="mt-1 text-sm text-gray-500">This area is restricted to CareerSetu administrators.</p>
        </main>
      </>
    )
  }

  const selectClass = 'rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500'

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-3xl px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question bank · review</h1>
          <p className="mt-1 text-sm text-gray-500">Generate draft questions, then approve the good ones to publish them.</p>
        </div>

        {/* Generation panel */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              Track
              <select value={trackId} onChange={e => setTrackId(e.target.value)} className={selectClass}>
                {tracks.map(t => (
                  <option key={t.id} value={t.id}>{t.parent_id ? `— ${t.name}` : t.name}</option>
                ))}
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
                {ROUND_TYPES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              Difficulty
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={selectClass}>
                {DIFFICULTIES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              Format
              <select value={format} onChange={e => setFormat(e.target.value)} className={selectClass}>
                {FORMATS.map(f => <option key={f} value={f}>{f === 'mcq' ? 'MCQ' : 'Interview'}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              Count (max 15)
              <input type="number" min={1} max={15} value={count}
                onChange={e => setCount(Number(e.target.value))} className={selectClass} />
            </label>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !trackId}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? 'Generating…' : 'Generate drafts'}
          </button>
        </div>

        {/* Drafts */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Pending drafts ({drafts.length})</h2>
        </div>

        {loadingDrafts ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
        ) : drafts.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
            No pending drafts. Generate some above.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {drafts.map(q => (
              <div key={q.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {[q.tracks?.name, q.companies?.name ?? 'Neutral', q.round_type, q.difficulty, q.format.toUpperCase()].filter(Boolean).map((tag, i) => (
                    <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">{tag}</span>
                  ))}
                </div>
                <p className="text-sm font-medium text-gray-900 leading-relaxed">{q.question_text}</p>

                {q.format === 'mcq' && q.options && (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {q.options.map((opt, i) => (
                      <li key={i} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
                        i === q.correct_option ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-600'
                      }`}>
                        {i === q.correct_option ? <Check className="h-3.5 w-3.5 text-green-600 shrink-0" /> : <span className="h-3.5 w-3.5 shrink-0" />}
                        {opt}
                      </li>
                    ))}
                  </ul>
                )}

                {q.explanation && (
                  <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-600">{q.format === 'mcq' ? 'Why: ' : 'Key points: '}</span>
                    {q.explanation}
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => review(q.id, 'approve')}
                    disabled={busyId === q.id}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    {busyId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Approve
                  </button>
                  <button
                    onClick={() => review(q.id, 'reject')}
                    disabled={busyId === q.id}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
