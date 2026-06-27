'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Library, ChevronRight } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'

export default function QuestionBankPage() {
  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question bank</h1>
          <p className="mt-1 text-sm text-gray-500">Browse practice questions by company, track and round.</p>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Library className="h-6 w-6" />
          </div>
          <p className="text-base font-semibold text-gray-900">The bank is being prepared</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            Curated questions across our skill tracks and leading IT companies are on the way.
            In the meantime, start a mock interview to practise live.
          </p>
          <Link
            href="/practice"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Go to Practice
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </>
  )
}
