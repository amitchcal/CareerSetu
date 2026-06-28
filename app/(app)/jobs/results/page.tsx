'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ExternalLink, Sparkles, MapPin, Building2,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Briefcase,
} from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import { JobResult } from '@/types'
import { supabase } from '@/lib/supabase'

function MatchRing({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  const r = 20
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg viewBox="0 0 48 48" className="w-14 h-14 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-bold"
        style={{ color }}
      >
        {score}%
      </span>
    </div>
  )
}

function JobCard({ job, userId, cvText }: { job: JobResult; userId: string; cvText: string }) {
  const [expanded, setExpanded] = useState(false)
  const [tailoring, setTailoring] = useState(false)
  const router = useRouter()

  async function handleTailor() {
    setTailoring(true)
    const res = await fetch('/api/jobs/tailor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, jobResultId: job.id, cvText }),
    })
    setTailoring(false)
    if (res.ok) {
      router.push(`/jobs/${job.id}/tailor`)
    }
  }

  const source = job.source?.toLowerCase() ?? ''
  const sourceBadge = source.includes('linkedin') ? 'LinkedIn'
    : source.includes('naukri') ? 'Naukri'
    : source.includes('indeed') ? 'Indeed'
    : source.includes('glassdoor') ? 'Glassdoor'
    : 'Job Board'

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <MatchRing score={job.match_score ?? 0} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-semibold text-gray-900 leading-tight">{job.title}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-sm text-gray-500">
                <Building2 className="w-3.5 h-3.5" />
                <span>{job.company}</span>
                {job.location && (
                  <>
                    <span className="text-gray-300">·</span>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.location}</span>
                  </>
                )}
              </div>
            </div>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">{sourceBadge}</span>
          </div>

          {/* Skills row */}
          <div className="mt-3 space-y-1.5">
            {(job.matched_skills ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(job.matched_skills ?? []).slice(0, 4).map(s => (
                  <span key={s} className="inline-flex items-center gap-0.5 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />{s}
                  </span>
                ))}
              </div>
            )}
            {(job.missing_skills ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(job.missing_skills ?? []).slice(0, 3).map(s => (
                  <span key={s} className="inline-flex items-center gap-0.5 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" />{s}
                  </span>
                ))}
                {(job.missing_skills ?? []).length > 3 && (
                  <span className="text-xs text-gray-400">+{(job.missing_skills ?? []).length - 3} missing</span>
                )}
              </div>
            )}
          </div>

          {/* Description toggle */}
          {job.description && (
            <button
              className="mt-3 text-xs text-gray-400 flex items-center gap-0.5 hover:text-gray-600"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide description' : 'Show description'}
            </button>
          )}

          {expanded && job.description && (
            <p className="mt-2 text-xs text-gray-600 leading-relaxed whitespace-pre-line line-clamp-6">
              {job.description}
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Apply <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={handleTailor}
              disabled={tailoring}
              className="flex items-center gap-1.5 text-sm border border-indigo-300 text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {tailoring ? 'Tailoring…' : 'Tailor My Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JobResultsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobResult[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [cvText, setCvText] = useState('')
  const [query, setQuery] = useState('')
  const [filterScore, setFilterScore] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
    })

    const stored = sessionStorage.getItem('job_results')
    if (stored) setJobs(JSON.parse(stored))
    else router.replace('/jobs')

    setCvText(sessionStorage.getItem('job_cv_text') ?? '')
    setQuery(sessionStorage.getItem('job_search_query') ?? '')
  }, [router])

  const filtered = jobs.filter(j => (j.match_score ?? 0) >= filterScore)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isLoggedIn />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {jobs.length} jobs found {query && <span className="font-normal text-gray-500">for &ldquo;{query}&rdquo;</span>}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Ranked by skill match</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-1">
          {[0, 40, 60, 70].map(v => (
            <button
              key={v}
              onClick={() => setFilterScore(v)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filterScore === v
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border text-gray-600 hover:border-indigo-300'
              }`}
            >
              {v === 0 ? 'All' : `${v}%+ match`}
            </button>
          ))}
          <span className="flex-shrink-0 text-xs text-gray-400 ml-auto">{filtered.length} shown</span>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center text-gray-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No jobs at this match threshold</p>
            <button onClick={() => setFilterScore(0)} className="mt-2 text-sm text-indigo-600 underline">Show all</button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(job => (
              <JobCard key={job.id} job={job} userId={userId ?? ''} cvText={cvText} />
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/jobs" className="text-sm text-indigo-600 hover:underline">
            ← New search
          </Link>
        </div>
      </main>
    </div>
  )
}
