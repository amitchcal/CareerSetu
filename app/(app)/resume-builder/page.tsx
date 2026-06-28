'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText, Star, Pencil, Trash2, Loader2 } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'

interface ResumeEntry {
  id: string
  title: string
  is_default: boolean
  updated_at: string
}

export default function ResumeBuilderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userId, setUserId] = useState('')
  const [resumes, setResumes] = useState<ResumeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
      fetchResumes(session.user.id)
    })
  }, [router])

  async function fetchResumes(uid: string) {
    setLoading(true)
    const res = await fetch(`/api/resume?userId=${uid}`)
    const data = await res.json()
    setResumes(data.resumes ?? [])
    setLoading(false)
  }

  async function createNew() {
    setCreating(true)
    const res = await fetch('/api/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title: 'Untitled Resume' }),
    })
    const data = await res.json()
    if (data.resumeId) {
      router.push(`/resume-builder/${data.resumeId}`)
    } else {
      toast({ title: 'Error', description: 'Could not create resume', variant: 'destructive' })
      setCreating(false)
    }
  }

  async function deleteResume(id: string) {
    if (!confirm('Delete this resume? This cannot be undone.')) return
    await fetch(`/api/resume/${id}?userId=${userId}`, { method: 'DELETE' })
    setResumes(r => r.filter(x => x.id !== id))
    toast({ title: 'Deleted', description: 'Resume removed.' })
  }

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resume Builder</h1>
            <p className="mt-1 text-sm text-gray-500">Build AI-powered resumes tailored to your target roles.</p>
          </div>
          <Button onClick={createNew} disabled={creating} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            New Resume
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-base font-semibold text-gray-700">No resumes yet</h3>
            <p className="mt-1 text-sm text-gray-400">Create your first AI-powered resume in minutes.</p>
            <Button onClick={createNew} disabled={creating} className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Resume
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {resumes.map(r => (
              <div key={r.id} className="group relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{r.title}</p>
                        {r.is_default && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <Star className="h-3 w-3" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Updated {new Date(r.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/resume-builder/${r.id}`}>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => deleteResume(r.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <Link href={`/resume-builder/${r.id}`} className="absolute inset-0 rounded-2xl" aria-hidden />
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <h3 className="text-sm font-semibold text-indigo-900 mb-1">Tip: Connect your interview sessions</h3>
          <p className="text-xs text-indigo-700">After completing a mock interview, visit the feedback page to extract strong resume bullet points directly from your answers.</p>
        </div>
      </main>
    </>
  )
}
