'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Eye, EyeOff, CheckCircle, Suspense } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import RoleSelect, { DEFAULT_ROLES } from '@/components/shared/RoleSelect'

// ─── Password rules ───────────────────────────────────────────────────────────

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
]

function isPasswordStrong(p: string) {
  return PASSWORD_RULES.every((r) => r.test(p))
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'password'

// ─── Edit Profile form ────────────────────────────────────────────────────────

function EditProfileForm({ userId }: { userId: string }) {
  const [name, setName] = useState('')
  const [roleValue, setRoleValue] = useState('')
  const [roleLabel, setRoleLabel] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('users')
      .select('name, target_role, phone')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setName(data.name ?? '')
          // Map stored target_role back to option or custom
          const match = DEFAULT_ROLES.find((r) => r.label === data.target_role)
          if (match) {
            setRoleValue(match.value)
            setRoleLabel(match.label)
          } else if (data.target_role) {
            setRoleValue('other')
            setRoleLabel('Other')
            setCustomRole(data.target_role)
          }
          // Strip +91 prefix for display
          const phone = (data.phone as string | null) ?? ''
          setMobile(phone.startsWith('+91') ? phone.slice(3) : phone)
        }
        setLoading(false)
      })
  }, [userId])

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Please enter your name.'
    if (!roleValue) e.role = 'Please select a role.'
    if (roleValue === 'other' && !customRole.trim()) e.customRole = 'Please describe your role.'
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) e.mobile = 'Enter a valid 10-digit Indian mobile number.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setSaved(false)

    const targetRole = roleValue === 'other' ? customRole.trim() : roleLabel

    try {
      const updates: Record<string, string> = {
        name: name.trim(),
        target_role: targetRole,
      }
      if (mobile) updates.phone = `+91${mobile}`

      const { error } = await supabase.from('users').update(updates).eq('id', userId)
      if (error) throw error
      setSaved(true)
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save profile.'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function clearError(field: string) {
    if (errors[field]) setErrors((e) => { const next = { ...e }; delete next[field]; return next })
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-5">
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
          onChange={(e) => { setName(e.target.value); clearError('name') }}
          className={`rounded-xl border-2 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
        />
        {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
      </div>

      {/* Role */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Target role / category <span className="text-red-500">*</span>
        </label>
        <RoleSelect
          value={roleValue}
          onChange={(v, l) => {
            setRoleValue(v); setRoleLabel(l); clearError('role')
            if (v !== 'other') { setCustomRole(''); clearError('customRole') }
          }}
          options={DEFAULT_ROLES}
          error={errors.role}
        />
        {roleValue === 'other' && (
          <input
            type="text"
            placeholder="Describe your target role…"
            value={customRole}
            onChange={(e) => { setCustomRole(e.target.value); clearError('customRole') }}
            className={`mt-1 rounded-xl border-2 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${errors.customRole ? 'border-red-400' : 'border-gray-200'}`}
          />
        )}
        {errors.customRole && <p className="text-xs text-red-600">{errors.customRole}</p>}
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="mobile" className="text-sm font-medium text-gray-700">
          Mobile number
        </label>
        <div className={`flex rounded-xl border-2 overflow-hidden transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 ${errors.mobile ? 'border-red-400' : 'border-gray-200'}`}>
          <span className="flex items-center bg-gray-50 px-3.5 text-sm font-medium text-gray-500 border-r border-gray-200 select-none">+91</span>
          <input
            id="mobile"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="98765 43210"
            value={mobile}
            onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); clearError('mobile') }}
            className="flex-1 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none"
          />
        </div>
        {errors.mobile && <p className="text-xs text-red-600">{errors.mobile}</p>}
      </div>

      <button type="submit" disabled={saving}
        className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saved ? <><CheckCircle className="h-4 w-4" /> Saved</> : 'Save changes'}
      </button>
    </form>
  )
}

// ─── Change Password form ─────────────────────────────────────────────────────

function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordFocused, setPasswordFocused] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!current) e.current = 'Enter your current password.'
    if (!isPasswordStrong(password)) e.password = 'Password does not meet all requirements below.'
    if (password === current && current) e.password = 'New password must differ from current password.'
    if (!confirm) e.confirm = 'Please confirm your new password.'
    else if (password !== confirm) e.confirm = 'Passwords do not match.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      // Re-authenticate first to verify current password
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('Could not identify user.')

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      })
      if (signInErr) {
        setErrors({ current: 'Current password is incorrect.' })
        return
      }

      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' })
      setCurrent('')
      setPassword('')
      setConfirm('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not update password.'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  function clearError(field: string) {
    if (errors[field]) setErrors((e) => { const next = { ...e }; delete next[field]; return next })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Current password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="current" className="text-sm font-medium text-gray-700">
          Current password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="current"
            type={showCurrent ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your current password"
            value={current}
            onChange={(e) => { setCurrent(e.target.value); clearError('current') }}
            className={`w-full rounded-xl border-2 px-3.5 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${errors.current ? 'border-red-400' : 'border-gray-200'}`}
          />
          <button type="button" onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.current && <p className="text-xs text-red-600">{errors.current}</p>}
      </div>

      {/* New password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="newpassword" className="text-sm font-medium text-gray-700">
          New password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="newpassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError('password') }}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            className={`w-full rounded-xl border-2 px-3.5 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {(passwordFocused || password.length > 0) && (
          <ul className="mt-1 flex flex-col gap-1">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(password)
              return (
                <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {rule.label}
                </li>
              )
            })}
          </ul>
        )}
        {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
      </div>

      {/* Confirm new password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmpassword" className="text-sm font-medium text-gray-700">
          Confirm new password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="confirmpassword"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); clearError('confirm') }}
            className={`w-full rounded-xl border-2 px-3.5 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${errors.confirm ? 'border-red-400' : 'border-gray-200'}`}
          />
          <button type="button" onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirm && <p className="text-xs text-red-600">{errors.confirm}</p>}
      </div>

      <button type="submit" disabled={loading}
        className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Update password
      </button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('profile')

  useEffect(() => {
    if (searchParams.get('tab') === 'password') setTab('password')
  }, [searchParams])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
      setAuthLoading(false)
    })
  }, [router])

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Edit Profile' },
    { id: 'password', label: 'Change Password' },
  ]

  return (
    <div className="mx-auto max-w-lg py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Account settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 mb-6">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {tab === 'profile' && userId && <EditProfileForm userId={userId} />}
        {tab === 'password' && <ChangePasswordForm />}
      </div>
    </div>
  )
}

export default function ProfilePageWrapper() {
  return (
    <Suspense>
      <ProfilePage />
    </Suspense>
  )
}
