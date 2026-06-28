'use client'

import { useState, useEffect } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import IssueReportModal from './IssueReportModal'
import { supabase } from '@/lib/supabase'

export default function IssueButton() {
  const [open, setOpen] = useState(false)
  const [prefill, setPrefill] = useState<{ name?: string; email?: string; userId?: string }>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      setPrefill({
        name: session.user.user_metadata?.full_name ?? '',
        email: session.user.email ?? '',
        userId: session.user.id,
      })
    })
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        Issue / Suggestion?
      </button>
      <IssueReportModal
        open={open}
        onClose={() => setOpen(false)}
        prefillName={prefill.name}
        prefillEmail={prefill.email}
        userId={prefill.userId}
      />
    </>
  )
}
