'use client'

import { useState, useRef } from 'react'
import { X, Upload, AlertTriangle, CheckCircle, Loader2, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

const CRITICALITY_OPTIONS = [
  { value: 'critical', label: 'Critical', desc: 'App is broken / data loss', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'major', label: 'Major', desc: 'Key feature not working', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'medium', label: 'Medium', desc: 'Partial functionality affected', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  { value: 'low', label: 'Low', desc: 'Minor inconvenience', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'suggestion', label: 'Suggestion', desc: 'Nice to have / idea', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
]

interface Props {
  open: boolean
  onClose: () => void
  prefillName?: string
  prefillEmail?: string
  userId?: string
}

export default function IssueReportModal({ open, onClose, prefillName = '', prefillEmail = '', userId }: Props) {
  const [name, setName] = useState(prefillName)
  const [email, setEmail] = useState(prefillEmail)
  const [phone, setPhone] = useState('')
  const [criticality, setCriticality] = useState('')
  const [description, setDescription] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ticketRef, setTicketRef] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email is required'
    if (!criticality) e.criticality = 'Please select a criticality'
    if (!description.trim() || description.trim().length < 20) e.description = 'Please describe the issue (at least 20 characters)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setUploading(true)
    try {
      let screenshotUrl: string | undefined
      if (screenshot) {
        const ext = screenshot.name.split('.').pop()
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('ticket-screenshots').upload(path, screenshot)
        if (!uploadErr) {
          const { data } = supabase.storage.from('ticket-screenshots').getPublicUrl(path)
          screenshotUrl = data.publicUrl
        }
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, criticality, description, screenshotUrl, userId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setTicketRef(json.ticket.ticket_ref)
      setSubmitted(true)
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  function handleClose() {
    setName(prefillName)
    setEmail(prefillEmail)
    setPhone('')
    setCriticality('')
    setDescription('')
    setScreenshot(null)
    setErrors({})
    setSubmitted(false)
    setTicketRef('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-[#16171a] rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#16171a] rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Report an Issue / Suggestion</h2>
          </div>
          <button onClick={handleClose} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ticket Raised!</h3>
            <p className="text-sm text-gray-500">Your ticket reference is</p>
            <p className="text-2xl font-bold text-indigo-600">{ticketRef}</p>
            <p className="text-sm text-gray-500">A confirmation email has been sent to <strong>{email}</strong>. We will update you once the issue is resolved.</p>
            <Button onClick={handleClose} className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
            {errors.submit && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {errors.submit}
              </div>
            )}

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">Phone <span className="text-gray-400">(optional)</span></label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Criticality */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-2">Criticality <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 gap-1.5">
                {CRITICALITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCriticality(opt.value)}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all ${
                      criticality === opt.value
                        ? opt.color + ' border-current ring-1 ring-current'
                        : 'border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-gray-500 dark:text-neutral-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
              {errors.criticality && <p className="mt-1 text-xs text-red-500">{errors.criticality}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">Describe the issue <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Please describe what happened, steps to reproduce, and expected behaviour..."
                rows={4}
                className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </div>

            {/* Screenshot */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">Screenshot <span className="text-gray-400">(optional)</span></label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 dark:border-neutral-700 px-4 py-3 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors w-full"
              >
                <Upload className="h-4 w-4" />
                {screenshot ? screenshot.name : 'Upload error screenshot (PNG, JPG, WEBP)'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={e => setScreenshot(e.target.files?.[0] ?? null)}
              />
            </div>

            <Button
              type="submit"
              disabled={uploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold mt-1"
            >
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : 'Submit Ticket'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
