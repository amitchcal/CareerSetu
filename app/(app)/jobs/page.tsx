'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, FileText, Search, MapPin, Briefcase, Loader2,
  AlertCircle,
} from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import { toast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { JobResult } from '@/types'

type Step = 'upload' | 'search' | 'searching'

const EXPERIENCE_LEVELS = [
  { value: 'fresher', label: 'Fresher (0–1 yr)' },
  { value: 'intermediate', label: 'Intermediate (2–5 yr)' },
  { value: 'experienced', label: 'Experienced (5+ yr)' },
]

export default function JobsPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('upload')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvText, setCvText] = useState('')
  const [extractedSkills, setExtractedSkills] = useState<string[]>([])
  const [parsing, setParsing] = useState(false)

  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [experience, setExperience] = useState('intermediate')

  const [dragging, setDragging] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [useProfileSkills, setUseProfileSkills] = useState(false)
  const [profileSkills, setProfileSkills] = useState<string[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
      supabase
        .from('users')
        .select('target_role, experience_level, resume_text')
        .eq('id', session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.target_role) setQuery(data.target_role)
          if (data?.experience_level) setExperience(data.experience_level)
          if (data?.resume_text) {
            // Parse skills from stored resume_text if available
            setProfileSkills([])
          }
        })
    })
  }, [router])

  async function handleFileSelect(file: File) {
    if (!file) return
    setCvFile(file)
    setParsing(true)

    const form = new FormData()
    form.append('cv', file)

    const res = await fetch('/api/cv/parse', { method: 'POST', body: form })
    const data = await res.json()

    setParsing(false)
    if (!res.ok) { toast({ title: 'Parse error', description: data.error, variant: 'destructive' }); return }

    setExtractedSkills(data.skills ?? [])
    setCvText(data.cvText ?? '')
    if (data.currentRole && !query) setQuery(data.currentRole)

    toast({ title: 'CV parsed', description: `Found ${data.skills?.length ?? 0} skills` })
    setStep('search')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  async function handleSearch() {
    const skills = useProfileSkills ? profileSkills : extractedSkills
    if (!query.trim()) { toast({ title: 'Enter a job title', variant: 'destructive' }); return }
    if (!skills.length) { toast({ title: 'No skills found', description: 'Upload a CV first', variant: 'destructive' }); return }

    setStep('searching')

    // Store cvText in sessionStorage so tailor page can access it
    sessionStorage.setItem('job_cv_text', cvText)
    sessionStorage.setItem('job_skills', JSON.stringify(skills))

    const res = await fetch('/api/jobs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, query: query.trim(), location: location.trim() || undefined, extractedSkills: skills }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast({ title: 'Search failed', description: data.error, variant: 'destructive' })
      setStep('search')
      return
    }

    const jobs: JobResult[] = data.jobs ?? []
    sessionStorage.setItem('job_results', JSON.stringify(jobs))
    sessionStorage.setItem('job_search_query', query.trim())
    router.push('/jobs/results')
  }

  const skills = useProfileSkills ? profileSkills : extractedSkills

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isLoggedIn />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Find Matching Jobs</h1>
          <p className="text-gray-500 mt-1 text-sm">Upload your CV to discover jobs that match your skills — with a personalised match score.</p>
        </div>

        {/* Step 1 — CV Upload */}
        <div className={`bg-white rounded-2xl border shadow-sm p-6 mb-4 ${step !== 'upload' ? 'opacity-60' : ''}`}>
          <h2 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            Upload your CV
          </h2>

          {step === 'upload' ? (
            <>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-indigo-500 bg-indigo-50' : cvFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-indigo-400'
                }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
                />
                {parsing ? (
                  <div className="flex flex-col items-center gap-2 text-indigo-600">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-sm">Extracting skills from your CV…</span>
                  </div>
                ) : cvFile ? (
                  <div className="flex flex-col items-center gap-2 text-green-700">
                    <FileText className="w-8 h-8" />
                    <span className="text-sm font-medium">{cvFile.name}</span>
                    <button
                      className="text-xs text-gray-400 underline mt-1"
                      onClick={e => { e.stopPropagation(); setCvFile(null); setExtractedSkills([]); setStep('upload') }}
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Upload className="w-8 h-8" />
                    <span className="text-sm">Drag & drop or click to upload PDF / DOCX</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <FileText className="w-4 h-4" />
              <span>{cvFile?.name}</span>
              <span className="text-gray-400">— {extractedSkills.length} skills extracted</span>
            </div>
          )}
        </div>

        {/* Step 2 — Search params */}
        {(step === 'search' || step === 'searching') && (
          <div className="bg-white rounded-2xl border shadow-sm p-6 mb-4">
            <h2 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              Job search criteria
            </h2>

            {/* Extracted skills preview */}
            {skills.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Skills from your CV:</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 12).map(s => (
                    <span key={s} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {skills.length > 12 && (
                    <span className="text-xs text-gray-400 px-2 py-0.5">+{skills.length - 12} more</span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Job title or role (e.g. Product Manager)"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Location (e.g. Bengaluru) — leave blank for remote/any"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <select
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                value={experience}
                onChange={e => setExperience(e.target.value)}
              >
                {EXPERIENCE_LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSearch}
              disabled={step === 'searching'}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors"
            >
              {step === 'searching' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Finding matching jobs…</>
              ) : (
                <><Search className="w-4 h-4" /> Search Jobs</>
              )}
            </button>
          </div>
        )}

        {/* Helper tip */}
        {step === 'upload' && !parsing && (
          <div className="flex items-start gap-2 text-xs text-gray-500 mt-4">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
            <span>We search LinkedIn, Indeed, Naukri and 50+ sources. Your CV is never stored publicly.</span>
          </div>
        )}
      </main>
    </div>
  )
}
