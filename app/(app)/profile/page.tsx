'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import Navbar from '@/components/shared/Navbar'
import RoleSelect, { DEFAULT_ROLES } from '@/components/shared/RoleSelect'

type Difficulty = 'fresher' | 'intermediate' | 'experienced'
type Language = 'english' | 'hindi' | 'hinglish'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [roleValue, setRoleValue] = useState('')
  const [roleLabel, setRoleLabel] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('fresher')
  const [language, setLanguage] = useState<Language>('english')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
      setEmail(session.user.email ?? '')

      const { data: user } = await supabase
        .from('users')
        .select('name, target_role, experience_level, preferred_language')
        .eq('id', session.user.id)
        .maybeSingle()

      if (user) {
        setName(user.name ?? '')
        if (user.target_role) {
          const match = DEFAULT_ROLES.find(r => r.label === user.target_role)
          if (match) { setRoleValue(match.value); setRoleLabel(match.label) }
          else { setRoleValue('other'); setRoleLabel('Other'); setCustomRole(user.target_role) }
        }
        if (user.experience_level) setDifficulty(user.experience_level as Difficulty)
        if (user.preferred_language) setLanguage(user.preferred_language as Language)
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSave() {
    if (!name.trim()) { toast({ title: 'Name required', description: 'Please enter your name.', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const finalRole = roleValue === 'other' ? customRole.trim() : roleLabel
      const { error } = await supabase.from('users').upsert({
        id: userId,
        name: name.trim(),
        target_role: finalRole || null,
        experience_level: difficulty,
        preferred_language: language,
      }, { onConflict: 'id' })
      if (error) throw error
      toast({ title: 'Profile saved', description: 'Your changes have been updated.' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save profile.'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <>
      <Navbar isLoggedIn />
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    </>
  )

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Update your details to personalise your mock interviews.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Full name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="rounded-xl border-2 border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Email — read only */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="rounded-xl border-2 border-gray-100 bg-gray-50 px-3.5 py-3 text-sm text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400">Email is linked to your Google account and cannot be changed here.</p>
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Target role</label>
            <RoleSelect
              value={roleValue}
              onChange={(v, l) => { setRoleValue(v); setRoleLabel(l); if (v !== 'other') setCustomRole('') }}
              options={DEFAULT_ROLES}
            />
            {roleValue === 'other' && (
              <input
                type="text"
                value={customRole}
                onChange={e => setCustomRole(e.target.value)}
                placeholder="Describe your target role…"
                className="mt-1 rounded-xl border-2 border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            )}
          </div>

          {/* Experience level */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Experience level</span>
            <div className="flex gap-2">
              {(['fresher', 'intermediate', 'experienced'] as Difficulty[]).map(d => (
                <label key={d} className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-2.5 text-sm font-medium transition-all capitalize ${difficulty === d ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                  <input type="radio" name="difficulty" value={d} checked={difficulty === d} onChange={() => setDifficulty(d)} className="sr-only" />
                  {d}
                </label>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Preferred language</span>
            <div className="flex gap-2">
              {(['english', 'hindi', 'hinglish'] as Language[]).map(l => (
                <label key={l} className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-2.5 text-sm font-medium transition-all capitalize ${language === l ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                  <input type="radio" name="language" value={l} checked={language === l} onChange={() => setLanguage(l)} className="sr-only" />
                  {l}
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </main>
    </>
  )
}
