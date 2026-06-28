'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldAlert, CheckCircle, Clock, Eye, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/shared/Navbar'
import { toast } from '@/hooks/useToast'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

const CRITICALITY_COLORS: Record<string, string> = {
  critical: 'text-red-700 bg-red-50 border-red-200',
  major: 'text-orange-700 bg-orange-50 border-orange-200',
  medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  low: 'text-blue-700 bg-blue-50 border-blue-200',
  suggestion: 'text-indigo-700 bg-indigo-50 border-indigo-200',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'text-red-600 bg-red-50',
  in_progress: 'text-amber-600 bg-amber-50',
  closed: 'text-green-600 bg-green-50',
}

interface Ticket {
  id: string
  ticket_ref: string
  name: string
  email: string
  phone: string | null
  criticality: string
  description: string
  screenshot_url: string | null
  status: string
  admin_comment: string | null
  created_at: string
  updated_at: string
}

export default function AdminIssuesPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [token, setToken] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email?.toLowerCase() ?? ''
      if (!session || !ADMIN_EMAILS.includes(email)) {
        setAuthChecked(true)
        return
      }
      setIsAdmin(true)
      setToken(session.access_token)
      setAuthChecked(true)
    })
  }, [])

  const fetchTickets = useCallback(async (tok: string) => {
    setLoading(true)
    const res = await fetch(`/api/tickets?status=${statusFilter}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    const json = await res.json()
    setTickets(json.tickets ?? [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => {
    if (isAdmin && token) fetchTickets(token)
  }, [isAdmin, token, fetchTickets])

  async function updateTicket(id: string, status: string) {
    setResolving(id)
    const comment = commentDraft[id] ?? ''
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, adminComment: comment }),
    })
    if (res.ok) {
      toast({ title: 'Ticket updated', description: `Marked as ${status}` })
      fetchTickets(token)
      setExpanded(null)
    } else {
      toast({ title: 'Error', description: 'Could not update ticket', variant: 'destructive' })
    }
    setResolving(null)
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Access Only</h1>
        <p className="text-sm text-gray-500">You do not have permission to view this page.</p>
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    )
  }

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  }

  const filtered = statusFilter === 'all' ? tickets : tickets.filter(t => t.status === statusFilter)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0c0e]">
      <Navbar isLoggedIn />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and resolve user-reported issues and suggestions</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {(['all', 'open', 'in_progress', 'closed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-400 border-gray-200 dark:border-neutral-700 hover:border-indigo-400'
              }`}
            >
              {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 text-xs opacity-70">{counts[s]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No tickets in this category</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(ticket => (
              <div key={ticket.id} className="bg-white dark:bg-[#16171a] rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
                {/* Ticket row */}
                <div
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                  onClick={() => setExpanded(expanded === ticket.id ? null : ticket.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-indigo-600">{ticket.ticket_ref}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CRITICALITY_COLORS[ticket.criticality] ?? ''}`}>
                        {ticket.criticality}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] ?? ''}`}>
                        {ticket.status === 'in_progress' ? 'In Progress' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white truncate">{ticket.name} — <span className="font-normal text-gray-500">{ticket.email}</span></p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ticket.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{new Date(ticket.created_at).toLocaleDateString('en-IN')}</span>
                    {expanded === ticket.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === ticket.id && (
                  <div className="border-t border-gray-100 dark:border-neutral-800 px-4 py-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-xs text-gray-400 block">Phone</span><span className="text-gray-700 dark:text-neutral-300">{ticket.phone ?? '—'}</span></div>
                      <div><span className="text-xs text-gray-400 block">Raised on</span><span className="text-gray-700 dark:text-neutral-300">{new Date(ticket.created_at).toLocaleString('en-IN')}</span></div>
                      <div><span className="text-xs text-gray-400 block">Last updated</span><span className="text-gray-700 dark:text-neutral-300">{new Date(ticket.updated_at).toLocaleString('en-IN')}</span></div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-1">Description</p>
                      <p className="text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    {ticket.screenshot_url && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Screenshot</p>
                        <a href={ticket.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
                          <Eye className="h-4 w-4" />
                          View screenshot
                        </a>
                      </div>
                    )}

                    {ticket.admin_comment && (
                      <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2">
                        <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-0.5">Admin comment</p>
                        <p className="text-sm text-green-800 dark:text-green-300">{ticket.admin_comment}</p>
                      </div>
                    )}

                    {ticket.status !== 'closed' && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400">Add a comment before closing (optional)</p>
                        <textarea
                          value={commentDraft[ticket.id] ?? ''}
                          onChange={e => setCommentDraft(p => ({ ...p, [ticket.id]: e.target.value }))}
                          placeholder="Describe what was done or why it was declined..."
                          rows={2}
                          className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <div className="flex gap-2 flex-wrap">
                          {ticket.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={resolving === ticket.id}
                              onClick={() => updateTicket(ticket.id, 'in_progress')}
                              className="border-amber-300 text-amber-700 hover:bg-amber-50"
                            >
                              {resolving === ticket.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                              Mark In Progress
                            </Button>
                          )}
                          <Button
                            size="sm"
                            disabled={resolving === ticket.id}
                            onClick={() => updateTicket(ticket.id, 'closed')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {resolving === ticket.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                            Close Ticket
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={resolving === ticket.id}
                            onClick={() => updateTicket(ticket.id, 'closed')}
                            className="text-gray-500 hover:text-red-600"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Won&#39;t Fix
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
