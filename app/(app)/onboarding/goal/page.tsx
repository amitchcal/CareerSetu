'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Calendar, Dumbbell, GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import ProgressIndicator from '@/components/shared/ProgressIndicator'

type GoalType = 'upcoming_interview' | 'general_practice' | 'campus_placement'

const GOAL_OPTIONS: {
  value: GoalType
  label: string
  sub: string
  Icon: React.ElementType
}[] = [
  {
    value: 'upcoming_interview',
    label: 'An upcoming interview',
    sub: 'I have a specific company or role in mind',
    Icon: Calendar,
  },
  {
    value: 'general_practice',
    label: 'General practice / skill-building',
    sub: 'Improve my interview skills over time',
    Icon: Dumbbell,
  },
  {
    value: 'campus_placement',
    label: 'Campus placement season',
    sub: 'Preparing for on-campus recruitment drives',
    Icon: GraduationCap,
  },
]

const REFERRAL_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'friend', label: 'A friend' },
  { value: 'college', label: 'College / university' },
  { value: 'other', label: 'Other' },
]

export default function OnboardingGoalPage() {
  const router = useRouter()

  const [authLoading, setAuthLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const [goal, setGoal] = useState<GoalType | ''>('')
  const [goalError, setGoalError] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [referral, setReferral] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Auth + profile-completeness guard
  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      const { data: user } = await supabase
        .from('users')
        .select('name, target_role')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!user?.name || !user?.target_role) {
        router.replace('/onboarding/profile')
        return
      }

      setUserId(session.user.id)
      setAuthLoading(false)
    }
    check()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!goal) {
      setGoalError('Please select what you are preparing for.')
      return
    }
    setGoalError('')

    if (!userId) return
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          goal_type: goal,
          target_interview_date: goal === 'upcoming_interview' && interviewDate ? interviewDate : null,
          referral_source: referral || null,
          onboarding_complete: true,
        })
        .eq('id', userId)

      if (error) throw error
      router.push('/onboarding/sample-interview')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save your goal.'
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
        <ProgressIndicator step={2} total={3} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">What are you preparing for?</h1>
          <p className="mt-1 text-sm text-gray-500">
            This helps us tailor the difficulty and style of your mock interviews.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          {/* Goal selection */}
          <div className="flex flex-col gap-3">
            {GOAL_OPTIONS.map(({ value, label, sub, Icon }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all ${
                  goal === value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="goal"
                  value={value}
                  checked={goal === value}
                  onChange={() => {
                    setGoal(value)
                    if (goalError) setGoalError('')
                    if (value !== 'upcoming_interview') setInterviewDate('')
                  }}
                  className="sr-only"
                />
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    goal === value ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${goal === value ? 'text-indigo-700' : 'text-gray-900'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{sub}</p>

                  {/* Date picker — only visible when this option is selected */}
                  {value === 'upcoming_interview' && goal === 'upcoming_interview' && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        When is your interview? <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="date"
                        value={interviewDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Custom radio dot */}
                <div
                  className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    goal === value ? 'border-indigo-600' : 'border-gray-300'
                  }`}
                >
                  {goal === value && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                </div>
              </label>
            ))}

            {goalError && <p className="text-xs text-red-600">{goalError}</p>}
          </div>

          {/* Referral source */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="referral" className="text-sm font-medium text-gray-700">
              How did you hear about us?{' '}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <select
              id="referral"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              className="rounded-xl border-2 border-gray-200 px-3.5 py-3 text-sm text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
            >
              <option value="">Select one…</option>
              {REFERRAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Start my first practice interview
          </button>
        </form>
      </div>
    </div>
  )
}
