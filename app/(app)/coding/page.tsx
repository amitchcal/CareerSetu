'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Code2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/shared/Navbar'

interface CodingQuestion {
  id: string
  question_text: string
  difficulty: string
  tags: string[] | null
}

export default function CodingListPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<CodingQuestion[]>([])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data } = await supabase
        .from('questions')
        .select('id, question_text, difficulty, tags')
        .eq('format', 'coding')
        .eq('status', 'approved')
        .order('difficulty', { ascending: true })
      setQuestions((data as CodingQuestion[]) ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-600"><Code2 className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coding assessment</h1>
            <p className="text-sm text-gray-500">Write code, run it against tests, get instant results.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
        ) : questions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
            <Code2 className="mx-auto h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-700">No coding problems yet</p>
            <p className="mt-1 text-xs text-gray-400">Approved coding problems will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {questions.map(q => {
              const title = q.question_text.split('\n')[0]
              return (
                <Link key={q.id} href={`/coding/${q.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-teal-300 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">{q.difficulty}</span>
                      {(q.tags ?? []).slice(0, 3).map((t, i) => (
                        <span key={i} className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">{t}</span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
