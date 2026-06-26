'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lightbulb } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import Navbar from '@/components/shared/Navbar'
import RoleSelect, { DEFAULT_ROLES } from '@/components/shared/RoleSelect'

type Difficulty = 'fresher' | 'intermediate' | 'experienced'
type Language = 'english' | 'hindi' | 'hinglish'
type SessionLength = 'quick' | 'standard' | 'full'

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; sub: string }[] = [
  { value: 'fresher', label: 'Fresher', sub: '0–1 year experience' },
  { value: 'intermediate', label: 'Intermediate', sub: '1–3 years experience' },
  { value: 'experienced', label: 'Experienced', sub: '3+ years experience' },
]

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'hinglish', label: 'Hinglish' },
]

const LENGTH_OPTIONS: { value: SessionLength; label: string; sub: string; num: number }[] = [
  { value: 'quick', label: 'Quick', sub: '3 questions, ~5 min', num: 3 },
  { value: 'standard', label: 'Standard', sub: '5 questions, ~10 min', num: 5 },
  { value: 'full', label: 'Full', sub: '8 questions, ~15–20 min', num: 8 },
]

const TIPS = [
  'Find a quiet place with no background noise.',
  'Speak naturally, as you would in a real interview.',
  'You can review your recording before submitting each answer.',
]

function expTodifficulty(exp: string | null): Difficulty {
  if (exp === 'fresher') return 'fresher'
  if (exp === '3+ years') return 'experienced'
  return 'intermediate'
}

export default function InterviewNewPage() {
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [roleValue, setRoleValue] = useState('')
  const [roleLabel, setRoleLabel] = useState('')
  const [roleError, setRoleError] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [customRoleError, setCustomRoleError] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('fresher')
  const [language, setLanguage] = useState<Language>('english')
  const [sessionLength, setSessionLength] = useState<SessionLength>('standard')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)

      const { data: user } = await supabase
        .from('users')
        .select('target_role, experience_level, preferred_language')
        .eq('id', session.user.id)
        .maybeSingle()

      if (user) {
        // Pre-fill role
        if (user.target_role) {
          const match = DEFAULT_ROLES.find(r => r.label === user.target_role)
          if (match) {
            setRoleValue(match.value)
            setRoleLabel(match.label)
          } else {
            setRoleValue('other')
            setRoleLabel('Other')
            setCustomRole(user.target_role)
          }
        }
        // Pre-fill difficulty
        setDifficulty(expTodifficulty(user.experience_level))
        // Pre-fill language
        if (user.preferred_language) setLanguage(user.preferred_language as Language)
      }
      setAuthLoading(false)
    }
    init()
  }, [router])

  function validate(): boolean {
    let ok = true
    if (!roleValue) { setRoleError('Please select a role.'); ok = false } else setRoleError('')
    if (roleValue === 'other' && !customRole.trim()) { setCustomRoleError('Please describe your role.'); ok = false } else setCustomRoleError('')
    return ok
  }

  async function handleStart() {
    if (!validate() || !userId) return
    setStarting(true)

    const finalRole = roleValue === 'other' ? customRole.trim() : roleLabel
    const numQuestions = LENGTH_OPTIONS.find(l => l.value === sessionLength)!.num

    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: finalRole, difficulty, language, numQuestions }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not start interview.')
      router.push(`/interview/${data.sessionId}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      toast({ title: 'Failed to start', description: message, variant: 'destructive' })
      setStarting(false)
    }
  }

  if (authLoading) {
    return (
      <>
        <Navbar isLoggedIn />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configure your interview</h1>
          <p className="mt-1 text-sm text-gray-500">Customise the session to match your target.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-5">

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Role / category <span className="text-red-500">*</span></label>
            <RoleSelect
              value={roleValue}
              onChange={(v, l) => { setRoleValue(v); setRoleLabel(l); setRoleError(''); if (v !== 'other') { setCustomRole(''); setCustomRoleError('') } }}
              options={DEFAULT_ROLES}
              error={roleError}
            />
            {roleValue === 'other' && (
              <input
                type="text"
                placeholder="Describe your target role…"
                value={customRole}
                onChange={e => { setCustomRole(e.target.value); setCustomRoleError('') }}
                className={`mt-1 rounded-xl border-2 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${customRoleError ? 'border-red-400' : 'border-gray-200'}`}
              />
            )}
            {customRoleError && <p className="text-xs text-red-600">{customRoleError}</p>}
          </div>

          {/* Difficulty */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Difficulty</span>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTY_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex flex-1 min-w-[120px] cursor-pointer flex-col rounded-xl border-2 px-4 py-3 transition-all ${
                    difficulty === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" name="difficulty" value={opt.value} checked={difficulty === opt.value} onChange={() => setDifficulty(opt.value)} className="sr-only" />
                  <span className={`text-sm font-semibold ${difficulty === opt.value ? 'text-indigo-700' : 'text-gray-900'}`}>{opt.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{opt.sub}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Language</span>
            <div className="flex gap-2">
              {LANGUAGE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                    language === opt.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" name="language" value={opt.value} checked={language === opt.value} onChange={() => setLanguage(opt.value)} className="sr-only" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Session length */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Session length</span>
            <div className="flex flex-col gap-2">
              {LENGTH_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                    sessionLength === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" name="sessionLength" value={opt.value} checked={sessionLength === opt.value} onChange={() => setSessionLength(opt.value)} className="sr-only" />
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${sessionLength === opt.value ? 'border-indigo-600' : 'border-gray-300'}`}>
                    {sessionLength === opt.value && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${sessionLength === opt.value ? 'text-indigo-700' : 'text-gray-900'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-800">Before you start</span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={starting}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {starting && <Loader2 className="h-4 w-4 animate-spin" />}
          {starting ? 'Starting interview…' : 'Start Interview'}
        </button>

      </main>
    </>
  )
}
