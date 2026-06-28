'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2, Check, FileText, Plus, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  sessionId: string
  role: string
}

export default function ResumeInsightsPanel({ sessionId, role }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'adding' | 'added'>('idle')
  const [bullets, setBullets] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [resumes, setResumes] = useState<{ id: string; title: string }[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [pickedResumeId, setPickedResumeId] = useState('')

  async function extract() {
    setState('loading')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch(`/api/resume/session-insights/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id }),
    })
    const data = await res.json()
    if (Array.isArray(data.bullets)) {
      setBullets(data.bullets)
      setSelected(new Set(data.bullets.map((_: string, i: number) => i)))
      setState('done')
      // Also load resumes for picker
      const rRes = await fetch(`/api/resume?userId=${session.user.id}`)
      const rData = await rRes.json()
      setResumes(rData.resumes ?? [])
    } else {
      setState('idle')
    }
  }

  async function addToResume(resumeId: string) {
    setState('adding')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const chosen = bullets.filter((_, i) => selected.has(i))

    // Fetch current work_experience from the resume
    const res = await fetch(`/api/resume/${resumeId}`)
    const data = await res.json()
    const existingWork = data.resume?.work_experience ?? []

    // If there's a matching role entry, append to its bullets; else create a new entry
    const existingIdx = existingWork.findIndex((e: { role: string; company: string }) =>
      e.role?.toLowerCase().includes(role.toLowerCase()) || role.toLowerCase().includes(e.role?.toLowerCase())
    )

    let updatedWork
    if (existingIdx >= 0) {
      updatedWork = existingWork.map((e: { bullets: string[] }, i: number) =>
        i === existingIdx ? { ...e, bullets: [...(e.bullets ?? []), ...chosen] } : e
      )
    } else {
      updatedWork = [
        ...existingWork,
        {
          id: Math.random().toString(36).slice(2),
          company: '', role, location: '', start_date: '', end_date: '', is_current: false,
          bullets: chosen,
        },
      ]
    }

    await fetch(`/api/resume/${resumeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id, work_experience: updatedWork }),
    })
    setState('added')
    setPickedResumeId(resumeId)
    setShowPicker(false)
  }

  if (state === 'idle') {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 print:hidden">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-indigo-900">Turn this session into resume bullets</h2>
        </div>
        <p className="text-xs text-indigo-700 mb-4">
          AI will read your interview answers and extract 3–5 strong bullet points for your resume, formatted with the XYZ impact formula.
        </p>
        <button
          onClick={extract}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <Sparkles className="h-4 w-4" /> Extract resume bullets
        </button>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 flex items-center gap-3 print:hidden">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500 shrink-0" />
        <p className="text-sm text-indigo-700">Extracting resume bullets from your answers…</p>
      </div>
    )
  }

  if (state === 'added') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 flex items-center gap-3 print:hidden">
        <Check className="h-5 w-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800">Added to your resume!</p>
          <Link href={`/resume-builder/${pickedResumeId}`} className="text-xs text-green-700 underline hover:text-green-900 flex items-center gap-1 mt-0.5">
            Open resume builder <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm print:hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-gray-900">Resume bullets from this session</h2>
        </div>
        <button
          onClick={() => { setSelected(new Set(bullets.map((_, i) => i))); setSelected(prev => prev.size === bullets.length ? new Set() : new Set(bullets.map((_, i) => i))) }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {selected.size === bullets.length ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {bullets.map((b, i) => (
          <label key={i} className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.has(i)}
              onChange={() => {
                const s = new Set(selected)
                if (s.has(i)) { s.delete(i) } else { s.add(i) }
                setSelected(s)
              }}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 shrink-0"
            />
            <span className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900">{b}</span>
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {!showPicker ? (
          <button
            onClick={() => setShowPicker(true)}
            disabled={selected.size === 0 || state === 'adding'}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {state === 'adding' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add to resume ({selected.size})
          </button>
        ) : (
          <div className="w-full flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pick a resume:</p>
            {resumes.length > 0 ? (
              resumes.map(r => (
                <button
                  key={r.id}
                  onClick={() => addToResume(r.id)}
                  className="flex items-center justify-between rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left"
                >
                  {r.title} <ChevronRight className="h-4 w-4 text-gray-300" />
                </button>
              ))
            ) : (
              <p className="text-xs text-gray-400">No resumes found.</p>
            )}
            <Link href="/resume-builder" className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 mt-1">
              <Plus className="h-3.5 w-3.5" /> Create a new resume first
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
