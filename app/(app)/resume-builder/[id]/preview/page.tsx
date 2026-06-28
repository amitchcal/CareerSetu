'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ResumePreview from '@/components/shared/ResumePreview'

export default function ResumeFullPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const [resume, setResume] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/resume/${id}`).then(r => r.json()).then(d => {
      setResume(d.resume ?? null)
      setLoading(false)
    })
  }, [id])

  return (
    <>
      {/* Print-only style */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100">
        {/* Toolbar */}
        <div className="no-print sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="mx-auto max-w-3xl flex items-center justify-between">
            <Link href={`/resume-builder/${id}`} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Editor
            </Link>
            <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Printer className="h-4 w-4" /> Print / Save PDF
            </Button>
          </div>
        </div>

        <div className="px-4 py-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : resume ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <ResumePreview resume={resume as any} printMode />
          ) : (
            <p className="text-center text-gray-400 py-20">Resume not found.</p>
          )}
        </div>
      </div>
    </>
  )
}
