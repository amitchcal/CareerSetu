'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lightbulb, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import Navbar from '@/components/shared/Navbar'

type Seniority = 'fresher' | 'intermediate' | 'experienced' | 'lead'
type Language = 'english' | 'hindi' | 'hinglish'
type SessionLength = 'quick' | 'standard' | 'full'

interface TrackOpt { id: string; name: string; parent_id: string | null; sort_order: number }
interface CompanyOpt { id: string; name: string }

const SENIORITY_OPTIONS: { value: Seniority; label: string; sub: string }[] = [
  { value: 'fresher', label: 'Fresher', sub: '0–1 yr' },
  { value: 'intermediate', label: 'Intermediate', sub: '1–3 yr' },
  { value: 'experienced', label: 'Experienced', sub: '3+ yr' },
  { value: 'lead', label: 'Lead / Manager', sub: 'Leadership' },
]
const ROUND_OPTIONS = [
  { value: 'technical', label: 'Technical' },
  { value: 'hr', label: 'HR' },
  { value: 'managerial', label: 'Managerial' },
  { value: 'domain', label: 'Domain' },
]
const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'hinglish', label: 'Hinglish' },
]
const LENGTH_OPTIONS: { value: SessionLength; label: string; sub: string; num: number }[] = [
  { value: 'quick', label: 'Quick', sub: '3 questions, ~5 min', num: 3 },
  { value: 'standard', label: 'Standard', sub: '5 questions, ~10 min', num: 5 },
  { value: 'full', label: 'Full', sub: '8 questions, ~15–20 min', num: 8 },
]
const TIPS = [
  'Find a quiet place with no background noise.',
  'Speak naturally, as you would in a real interview.',
  'Tap the mic button when you finish your answer to move to the next question.',
]

function toSeniority(exp: string | null): Seniority {
  if (exp === 'fresher') return 'fresher'
  if (exp === '3+ years' || exp === 'experienced') return 'experienced'
  return 'intermediate'
}

export default function InterviewNewPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tracks, setTracks] = useState<TrackOpt[]>([])
  const [companies, setCompanies] = useState<CompanyOpt[]>([])

  const [trackId, setTrackId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [roundType, setRoundType] = useState('technical')
  const [seniority, setSeniority] = useState<Seniority>('fresher')
  const [language, setLanguage] = useState<Language>('english')
  const [sessionLength, setSessionLength] = useState<SessionLength>('standard')
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jdError, setJdError] = useState('')
  const [savedResume, setSavedResume] = useState('')
  const [useResume, setUseResume] = useState(true)
  const [starting, setStarting] = useState(false)
  const hasResume = savedResume.trim().length > 0

  const isSenior = seniority === 'experienced' || seniority === 'lead'

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)

      const [{ data: user }, { data: tk }, { data: co }] = await Promise.all([
        supabase.from('users').select('experience_level, preferred_language, resume_text').eq('id', session.user.id).maybeSingle(),
        supabase.from('tracks').select('id, name, parent_id, sort_order').eq('is_active', true).order('sort_order'),
        supabase.from('companies').select('id, name').order('sort_order'),
      ])
      const t = (tk as TrackOpt[]) ?? []
      setTracks(t)
      if (t.length) setTrackId(t[0].id)
      setCompanies((co as CompanyOpt[]) ?? [])
      if (user) {
        setSeniority(toSeniority(user.experience_level))
        if (user.preferred_language) setLanguage(user.preferred_language as Language)
        if (user.resume_text) setSavedResume(user.resume_text)
      }
      setAuthLoading(false)
    }
    init()
  }, [router])

  async function handleStart() {
    if (!userId || !trackId) return
    if (isSenior && !jobDescription.trim()) {
      setJdError('Please paste the job description for an experienced / lead interview.')
      return
    }
    setJdError('')
    setStarting(true)
    const numQuestions = LENGTH_OPTIONS.find(l => l.value === sessionLength)!.num
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, trackId, companyId: companyId || null, roundType, seniority,
          language, numQuestions,
          jobTitle: isSenior ? jobTitle.trim() : null,
          jobDescription: isSenior ? jobDescription.trim() : null,
          resumeText: isSenior && useResume ? savedResume : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not start interview.')
      sessionStorage.setItem(`interview_q1_${data.sessionId}`, data.firstQuestion)
      router.push(`/interview/${data.sessionId}`)
    } catch (err: unknown) {
      toast({ title: 'Failed to start', description: err instanceof Error ? err.message : 'Something went wrong.', variant: 'destructive' })
      setStarting(false)
    }
  }

  const selectClass = 'w-full rounded-xl border-2 border-gray-200 px-3.5 py-3 text-sm text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configure your interview</h1>
          <p className="mt-1 text-sm text-gray-500">Customise the session to match your target.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-5">
          {/* Track + Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              Track <span className="text-red-500">*</span>
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
          </div>

          {/* Round type */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Round type</span>
            <div className="flex flex-wrap gap-2">
              {ROUND_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex flex-1 min-w-[80px] cursor-pointer items-center justify-center rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${roundType === opt.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                  <input type="radio" name="round" checked={roundType === opt.value} onChange={() => setRoundType(opt.value)} className="sr-only" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Seniority */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Seniority</span>
            <div className="grid grid-cols-2 gap-2">
              {SENIORITY_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex cursor-pointer flex-col rounded-xl border-2 px-4 py-3 transition-all ${seniority === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="seniority" checked={seniority === opt.value} onChange={() => setSeniority(opt.value)} className="sr-only" />
                  <span className={`text-sm font-semibold ${seniority === opt.value ? 'text-indigo-700' : 'text-gray-900'}`}>{opt.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{opt.sub}</span>
                </label>
              ))}
            </div>
          </div>

          {/* JD for experienced / lead */}
          {isSenior && (
            <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <FileText className="h-4 w-4" /> Tailor to a job description
              </div>
              <input
                type="text"
                placeholder="Job title (optional) — e.g. Senior Backend Engineer"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                className="rounded-xl border-2 border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
              <textarea
                rows={5}
                placeholder="Paste the job description here. Questions will be tailored to its responsibilities and required skills."
                value={jobDescription}
                onChange={e => { setJobDescription(e.target.value); if (jdError) setJdError('') }}
                className={`rounded-xl border-2 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 resize-none ${jdError ? 'border-red-400' : 'border-gray-200'}`}
              />
              {jdError && <p className="text-xs text-red-600">{jdError}</p>}

              {hasResume ? (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-white border border-indigo-100 px-3 py-2.5">
                  <input type="checkbox" checked={useResume} onChange={e => setUseResume(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">Use my saved résumé to personalise questions</span>
                </label>
              ) : (
                <p className="text-xs text-gray-500">
                  Tip: add your résumé in <a href="/profile" className="font-medium text-indigo-600 hover:underline">Profile</a> to get questions tailored to your real experience.
                </p>
              )}
            </div>
          )}

          {/* Language */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Language</span>
            <div className="flex gap-2">
              {LANGUAGE_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${language === opt.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                  <input type="radio" name="language" checked={language === opt.value} onChange={() => setLanguage(opt.value)} className="sr-only" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Session length */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Session length</span>
            <div className="flex flex-col gap-2">
              {LENGTH_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${sessionLength === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="sessionLength" checked={sessionLength === opt.value} onChange={() => setSessionLength(opt.value)} className="sr-only" />
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${sessionLength === opt.value ? 'border-indigo-600' : 'border-gray-300'}`}>
                    {sessionLength === opt.value && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${sessionLength === opt.value ? 'text-indigo-700' : 'text-gray-900'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-800">Before you start</span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleStart}
          disabled={starting || !trackId}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {starting && <Loader2 className="h-4 w-4 animate-spin" />}
          {starting ? 'Starting interview…' : 'Start Interview'}
        </button>
      </main>
    </>
  )
}
