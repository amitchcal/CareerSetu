'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, Check, Library, SlidersHorizontal } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/shared/Navbar'

interface BankQuestion {
  id: string
  format: string
  round_type: string
  difficulty: string
  question_text: string
  options: string[] | null
  correct_option: number | null
  explanation: string | null
  tags: string[] | null
  track_id: string
  company_id: string | null
  tracks: { name: string; parent_id: string | null } | null
  companies: { name: string } | null
}
interface TrackOpt { id: string; name: string; parent_id: string | null; sort_order: number }
interface CompanyOpt { id: string; name: string }

const ROUNDS = ['technical', 'hr', 'managerial', 'aptitude', 'domain']
const DIFFICULTIES = ['fresher', 'intermediate', 'experienced']
const FORMATS = [
  { value: 'mcq', label: 'MCQ' },
  { value: 'interview', label: 'Interview' },
]

export default function QuestionBankPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<BankQuestion[]>([])
  const [tracks, setTracks] = useState<TrackOpt[]>([])
  const [companies, setCompanies] = useState<CompanyOpt[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [trackId, setTrackId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [round, setRound] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [format, setFormat] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const [{ data: qs }, { data: tk }, { data: co }] = await Promise.all([
        supabase
          .from('questions')
          .select('id, format, round_type, difficulty, question_text, options, correct_option, explanation, tags, track_id, company_id, tracks(name, parent_id), companies(name)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase.from('tracks').select('id, name, parent_id, sort_order').eq('is_active', true).order('sort_order'),
        supabase.from('companies').select('id, name').order('sort_order'),
      ])
      setQuestions((qs as unknown as BankQuestion[]) ?? [])
      setTracks((tk as TrackOpt[]) ?? [])
      setCompanies((co as CompanyOpt[]) ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  const filtered = useMemo(() => {
    return questions.filter(q =>
      (!trackId || q.track_id === trackId) &&
      (!companyId || (companyId === '__neutral__' ? !q.company_id : q.company_id === companyId)) &&
      (!round || q.round_type === round) &&
      (!difficulty || q.difficulty === difficulty) &&
      (!format || q.format === format)
    )
  }, [questions, trackId, companyId, round, difficulty, format])

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectClass = 'w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500'

  function Pills({ value, set, options }: { value: string; set: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => set('')} className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${value === '' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
        {options.map(o => (
          <button key={o.value} onClick={() => set(o.value)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${value === o.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{o.label}</button>
        ))}
      </div>
    )
  }

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question bank</h1>
          <p className="mt-1 text-sm text-gray-500">Browse approved practice questions by track, company and round.</p>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" /> Filters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-500">
              Track
              <select value={trackId} onChange={e => setTrackId(e.target.value)} className={selectClass}>
                <option value="">All tracks</option>
                {tracks.map(t => <option key={t.id} value={t.id}>{t.parent_id ? `— ${t.name}` : t.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-500">
              Company
              <select value={companyId} onChange={e => setCompanyId(e.target.value)} className={selectClass}>
                <option value="">All companies</option>
                <option value="__neutral__">Company-neutral</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5"><span className="text-xs font-medium text-gray-500">Round</span><Pills value={round} set={setRound} options={ROUNDS.map(r => ({ value: r, label: r }))} /></div>
            <div className="flex flex-col gap-1.5"><span className="text-xs font-medium text-gray-500">Difficulty</span><Pills value={difficulty} set={setDifficulty} options={DIFFICULTIES.map(d => ({ value: d, label: d }))} /></div>
            <div className="flex flex-col gap-1.5"><span className="text-xs font-medium text-gray-500">Format</span><Pills value={format} set={setFormat} options={FORMATS} /></div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map(i => <div key={i} className="h-28 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
            <Library className="mx-auto h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-700">
              {questions.length === 0 ? 'No approved questions yet' : 'No questions match these filters'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {questions.length === 0 ? 'Approved questions will appear here as the bank is curated.' : 'Try widening your filters.'}
            </p>
            <Link href="/interview/new" className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              Start a mock interview
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{filtered.length} question{filtered.length === 1 ? '' : 's'}</p>
              <Link href="/interview/new" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Practise live →</Link>
            </div>
            <div className="flex flex-col gap-3">
              {filtered.map(q => {
                const isOpen = expanded.has(q.id)
                return (
                  <div key={q.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {[q.tracks?.name, q.companies?.name ?? 'Neutral', q.round_type, q.difficulty, q.format === 'mcq' ? 'MCQ' : 'Interview'].filter(Boolean).map((tag, i) => (
                        <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">{tag}</span>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-gray-900 leading-relaxed">{q.question_text}</p>

                    <button onClick={() => toggle(q.id)} className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                      {isOpen ? 'Hide answer' : q.format === 'mcq' ? 'Show answer' : 'Show key points'}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="mt-3">
                        {q.format === 'mcq' && q.options && (
                          <ul className="flex flex-col gap-1.5">
                            {q.options.map((opt, i) => (
                              <li key={i} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${i === q.correct_option ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-600'}`}>
                                {i === q.correct_option ? <Check className="h-3.5 w-3.5 text-green-600 shrink-0" /> : <span className="h-3.5 w-3.5 shrink-0" />}
                                {opt}
                              </li>
                            ))}
                          </ul>
                        )}
                        {q.explanation && (
                          <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 leading-relaxed">
                            <span className="font-semibold text-gray-600">{q.format === 'mcq' ? 'Why: ' : 'Key points: '}</span>
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </>
  )
}
