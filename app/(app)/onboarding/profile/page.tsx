'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import ProgressIndicator from '@/components/shared/ProgressIndicator'
import RoleSelect, { DEFAULT_ROLES } from '@/components/shared/RoleSelect'

type ExperienceLevel = 'fresher' | '1-3 years' | '3+ years'
type PreferredLanguage = 'english' | 'hindi' | 'hinglish'

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'fresher', label: 'Fresher' },
  { value: '1-3 years', label: '1–3 years' },
  { value: '3+ years', label: '3+ years' },
]

const LANGUAGE_OPTIONS: { value: PreferredLanguage; label: string; sub: string }[] = [
  { value: 'english', label: 'English', sub: 'Questions & feedback in English' },
  { value: 'hindi', label: 'Hindi', sub: 'Questions & feedback in Hindi' },
  { value: 'hinglish', label: 'Hinglish', sub: 'Mix of Hindi and English' },
]

export default function OnboardingProfilePage() {
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [roleValue, setRoleValue] = useState('')
  const [roleLabel, setRoleLabel] = useState('')
  const [roleError, setRoleError] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [customRoleError, setCustomRoleError] = useState('')
  const [experience, setExperience] = useState<ExperienceLevel | ''>('')
  const [experienceError, setExperienceError] = useState('')
  const [language, setLanguage] = useState<PreferredLanguage>('english')
  const [submitting, setSubmitting] = useState(false)

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
        return
      }
      setUserId(session.user.id)
      setAuthLoading(false)
    })
  }, [router])

  function validate(): boolean {
    let ok = true

    if (!name.trim()) {
      setNameError('Please enter your name.')
      ok = false
    } else {
      setNameError('')
    }

    if (!roleValue) {
      setRoleError('Please select a role.')
      ok = false
    } else {
      setRoleError('')
    }

    if (roleValue === 'other' && !customRole.trim()) {
      setCustomRoleError('Please describe your role.')
      ok = false
    } else {
      setCustomRoleError('')
    }

    if (!experience) {
      setExperienceError('Please select your experience level.')
      ok = false
    } else {
      setExperienceError('')
    }

    return ok
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !userId) return

    const targetRole = roleValue === 'other' ? customRole.trim() : roleLabel

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          target_role: targetRole,
          experience_level: experience,
          preferred_language: language,
        })
        .eq('id', userId)

      if (error) throw error
      router.push('/onboarding/goal')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save your profile.'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg py-8 px-4">
      <div className="mb-8">
        <ProgressIndicator step={1} total={3} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Tell us about yourself</h1>
          <p className="mt-1 text-sm text-gray-500">
            We&apos;ll personalise your mock interviews based on this.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => { setName(e.target.value); if (nameError) setNameError('') }}
              className={`rounded-xl border-2 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
                nameError ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {nameError && <p className="text-xs text-red-600">{nameError}</p>}
          </div>

          {/* Target role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Target role / category <span className="text-red-500">*</span>
            </label>
            <RoleSelect
              value={roleValue}
              onChange={(v, l) => {
                setRoleValue(v)
                setRoleLabel(l)
                if (roleError) setRoleError('')
                if (v !== 'other') { setCustomRole(''); setCustomRoleError('') }
              }}
              options={DEFAULT_ROLES}
              error={roleError}
            />

            {/* Custom role input when "Other" is selected */}
            {roleValue === 'other' && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Describe your target role…"
                  value={customRole}
                  onChange={(e) => { setCustomRole(e.target.value); if (customRoleError) setCustomRoleError('') }}
                  className={`w-full rounded-xl border-2 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
                    customRoleError ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {customRoleError && <p className="mt-1 text-xs text-red-600">{customRoleError}</p>}
              </div>
            )}
          </div>

          {/* Experience level */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">
              Experience level <span className="text-red-500">*</span>
            </span>
            <div className="flex flex-wrap gap-3">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                    experience === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="experience"
                    value={opt.value}
                    checked={experience === opt.value}
                    onChange={() => { setExperience(opt.value); if (experienceError) setExperienceError('') }}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {experienceError && <p className="text-xs text-red-600">{experienceError}</p>}
          </div>

          {/* Preferred language */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Preferred language</span>
            <div className="flex flex-col gap-2">
              {LANGUAGE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                    language === opt.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="language"
                    value={opt.value}
                    checked={language === opt.value}
                    onChange={() => setLanguage(opt.value)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      language === opt.value ? 'border-indigo-600' : 'border-gray-300'
                    }`}
                  >
                    {language === opt.value && (
                      <div className="h-2 w-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${language === opt.value ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500">{opt.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}
