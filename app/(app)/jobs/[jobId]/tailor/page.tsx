'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Copy, Check, ExternalLink, Sparkles,
  BookOpen, Zap, Tag, Loader2, FileText, ChevronRight,
} from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'

interface TailorData {
  tailored_summary: string
  tailored_bullets: string[]
  keywords_added: string[]
  upskilling_suggestions: string[]
  job_result?: {
    title: string
    company: string
    apply_url: string
    match_score: number
  }
}

function ApplyToResume({ summary, bullets, role }: { summary: string; bullets: string[]; role: string }) {
  const [resumes, setResumes] = useState<{ id: string; title: string }[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [saving, setSaving] = useState('')
  const [saved, setSaved] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const res = await fetch(`/api/resume?userId=${session.user.id}`)
      const data = await res.json()
      setResumes(data.resumes ?? [])
      setLoadingList(false)
    })
  }, [])

  async function applyTo(resumeId: string) {
    setSaving(resumeId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch(`/api/resume/${resumeId}`)
    const rData = await res.json()
    const existing = rData.resume?.work_experience ?? []

    const updated = [
      {
        id: Math.random().toString(36).slice(2),
        company: '', role: role || 'Target Role', location: '',
        start_date: '', end_date: '', is_current: false,
        bullets,
      },
      ...existing,
    ]

    await fetch(`/api/resume/${resumeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.user.id,
        summary: summary || rData.resume?.summary,
        work_experience: updated,
      }),
    })
    setSaving('')
    setSaved(resumeId)
  }

  if (loadingList) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-500" /></div>

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-medium text-gray-800 mb-1">Apply tailored content to your resume</h2>
        <p className="text-xs text-gray-500">This will add the tailored summary and bullet points to a resume in your Resume Builder.</p>
      </div>
      {resumes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500 mb-3">No resumes yet. Create one first.</p>
          <Link href="/resume-builder" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1">
            Go to Resume Builder <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {resumes.map(r => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
              <span className="text-sm font-medium text-gray-800">{r.title}</span>
              {saved === r.id ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                  <Check className="h-4 w-4" /> Applied!
                </span>
              ) : (
                <button
                  onClick={() => applyTo(r.id)}
                  disabled={!!saving}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Apply
                </button>
              )}
            </div>
          ))}
          <Link href="/resume-builder" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1">
            <FileText className="h-3.5 w-3.5" /> Open Resume Builder
          </Link>
        </div>
      )}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

type Tab = 'summary' | 'bullets' | 'keywords' | 'upskill' | 'resume'

export default function TailorPage() {
  const router = useRouter()
  const { jobId } = useParams<{ jobId: string }>()

  const [data, setData] = useState<TailorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('summary')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const userId = session.user.id

      // Fetch from DB (already tailored by the time we navigate here)
      const { data: tailored } = await supabase
        .from('tailored_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('job_result_id', jobId)
        .maybeSingle()

      if (!tailored) {
        // Fallback: trigger tailor if not cached
        const cvText = sessionStorage.getItem('job_cv_text') ?? ''
        const res = await fetch('/api/jobs/tailor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, jobResultId: jobId, cvText }),
        })
        const result = await res.json()
        if (!res.ok) {
          toast({ title: 'Failed to tailor', description: result.error, variant: 'destructive' })
          setLoading(false)
          return
        }
        setData(result)
      } else {
        setData(tailored as TailorData)
      }

      // Also fetch job details
      const { data: job } = await supabase
        .from('job_results')
        .select('title, company, apply_url, match_score')
        .eq('id', jobId)
        .maybeSingle()

      if (job) {
        setData(prev => prev ? { ...prev, job_result: job } : prev)
      }

      setLoading(false)
    }

    load()
  }, [jobId, router])

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Summary', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'bullets', label: 'Key Bullets', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'keywords', label: 'Keywords', icon: <Tag className="w-3.5 h-3.5" /> },
    { id: 'upskill', label: 'Upskilling', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'resume', label: 'Apply to Resume', icon: <FileText className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isLoggedIn />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate">
              Tailored Profile
            </h1>
            {data?.job_result && (
              <p className="text-sm text-gray-500 truncate">
                {data.job_result.title} · {data.job_result.company}
              </p>
            )}
          </div>
          {data?.job_result?.apply_url && (
            <a
              href={data.job_result.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Apply <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border p-16 flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm">Tailoring your profile for this role…</p>
          </div>
        ) : !data ? (
          <div className="bg-white rounded-2xl border p-10 text-center text-gray-500">
            <p>Something went wrong. Please go back and try again.</p>
          </div>
        ) : (
          <>
            {/* Match score banner */}
            {data.job_result?.match_score != null && (
              <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                data.job_result.match_score >= 70 ? 'bg-green-50 text-green-800'
                : data.job_result.match_score >= 40 ? 'bg-amber-50 text-amber-800'
                : 'bg-red-50 text-red-700'
              }`}>
                <Sparkles className="w-4 h-4" />
                Current match: {data.job_result.match_score}% — the tailored content below will help close the gap.
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-white border rounded-xl p-1 mb-4 overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium flex-shrink-0 transition-colors ${
                    tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              {tab === 'summary' && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-medium text-gray-800">Professional Summary</h2>
                    <CopyButton text={data.tailored_summary ?? ''} />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {data.tailored_summary ?? '—'}
                  </p>
                  <p className="mt-4 text-xs text-gray-400">
                    Paste this at the top of your CV under your name.
                  </p>
                </>
              )}

              {tab === 'bullets' && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-medium text-gray-800">Impact Bullets</h2>
                    <CopyButton text={(data.tailored_bullets ?? []).map(b => `• ${b}`).join('\n')} />
                  </div>
                  <ul className="space-y-3">
                    {(data.tailored_bullets ?? []).map((b, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                        <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-gray-400">
                    Replace generic job description bullets with these in your experience section.
                  </p>
                </>
              )}

              {tab === 'keywords' && (
                <>
                  <h2 className="font-medium text-gray-800 mb-3">ATS Keywords Added</h2>
                  <p className="text-xs text-gray-500 mb-3">
                    These keywords from the JD have been incorporated into the tailored content. Make sure they appear naturally in your CV.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(data.keywords_added ?? []).map(k => (
                      <span key={k} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
                        {k}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {tab === 'resume' && data && (
                <ApplyToResume
                  summary={data.tailored_summary}
                  bullets={data.tailored_bullets}
                  role={data.job_result?.title ?? ''}
                />
              )}

              {tab === 'upskill' && (
                <>
                  <h2 className="font-medium text-gray-800 mb-3">Upskilling Suggestions</h2>
                  <p className="text-xs text-gray-500 mb-4">
                    Based on the missing skills for this role, here is what to learn next:
                  </p>
                  <ul className="space-y-3">
                    {(data.upskilling_suggestions ?? []).map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
