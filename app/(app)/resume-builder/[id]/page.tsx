'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  User, Briefcase, GraduationCap, Wrench, Award, FolderOpen,
  Sparkles, Plus, Trash2, ChevronDown, ChevronUp, Eye, Save,
  Loader2, ArrowLeft, Check
} from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import ResumePreview from '@/components/shared/ResumePreview'

// ── Types ────────────────────────────────────────────────────────────
interface PersonalInfo { name: string; email: string; phone: string; location: string; linkedin: string; github: string; website: string }
interface WorkExp { id: string; company: string; role: string; location: string; start_date: string; end_date: string; is_current: boolean; bullets: string[] }
interface Education { id: string; institution: string; degree: string; field: string; graduation_year: string; grade: string }
interface Skills { technical: string[]; soft: string[] }
interface Certification { id: string; name: string; issuer: string; year: string }
interface Project { id: string; name: string; description: string; link: string; tech: string[] }

interface Resume {
  id: string; title: string; personal_info: PersonalInfo; summary: string
  work_experience: WorkExp[]; education: Education[]; skills: Skills
  certifications: Certification[]; projects: Project[]
}

const SECTIONS = [
  { key: 'personal', label: 'Personal Info', icon: User },
  { key: 'summary', label: 'Summary', icon: Sparkles },
  { key: 'work', label: 'Work Experience', icon: Briefcase },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'skills', label: 'Skills', icon: Wrench },
  { key: 'certifications', label: 'Certifications', icon: Award },
  { key: 'projects', label: 'Projects', icon: FolderOpen },
]

const newId = () => Math.random().toString(36).slice(2)

const emptyResume = (): Resume => ({
  id: '', title: 'My Resume',
  personal_info: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '' },
  summary: '',
  work_experience: [],
  education: [],
  skills: { technical: [], soft: [] },
  certifications: [],
  projects: [],
})

// ── Main component ───────────────────────────────────────────────────
export default function ResumeEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [userId, setUserId] = useState('')
  const [resume, setResume] = useState<Resume>(emptyResume())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('personal')
  const [showPreview, setShowPreview] = useState(false)
  const [improvingSection, setImprovingSection] = useState('')

  useEffect(() => {
    async function fetchResume() {
      const res = await fetch(`/api/resume/${id}`)
      const data = await res.json()
      if (data.resume) {
        setResume({ ...emptyResume(), ...data.resume })
      }
      setLoading(false)
    }
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
      fetchResume()
    })
  }, [id, router])

  const save = useCallback(async (r: Resume) => {
    if (!userId || saving) return
    setSaving(true)
    await fetch(`/api/resume/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title: r.title,
        personal_info: r.personal_info,
        summary: r.summary,
        work_experience: r.work_experience,
        education: r.education,
        skills: r.skills,
        certifications: r.certifications,
        projects: r.projects,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [userId, id, saving])

  function update(patch: Partial<Resume>) {
    setResume(prev => ({ ...prev, ...patch }))
  }

  async function improveSection(section: string) {
    setImprovingSection(section)
    let content: unknown
    if (section === 'summary') content = resume.summary
    else if (section === 'skills') content = resume.skills
    else if (section === 'work_bullets') {
      const exp = resume.work_experience[0]
      if (!exp) { toast({ title: 'Add work experience first.' }); setImprovingSection(''); return }
      content = exp.bullets
    }

    const res = await fetch(`/api/resume/${id}/improve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, content, targetRole: resume.personal_info.name ? undefined : 'professional' }),
    })
    const data = await res.json()
    if (data.improved) {
      if (section === 'summary') update({ summary: data.improved as string })
      else if (section === 'skills') update({ skills: data.improved as Skills })
      toast({ title: 'Improved!', description: `AI has improved your ${section.replace('_', ' ')}.` })
    }
    setImprovingSection('')
  }

  if (loading) {
    return (
      <>
        <Navbar isLoggedIn />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar isLoggedIn />
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="sticky top-16 z-30 border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/resume-builder" className="text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <input
                value={resume.title}
                onChange={e => update({ title: e.target.value })}
                className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1 min-w-0 w-40 sm:w-56"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowPreview(p => !p)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{showPreview ? 'Edit' : 'Preview'}</span>
              </button>
              <Button
                onClick={() => save(resume)}
                disabled={saving}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                {saved ? <Check className="h-3.5 w-3.5" /> : saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saved ? 'Saved' : 'Save'}
              </Button>
              <Link href={`/resume-builder/${id}/preview`}>
                <Button size="sm" variant="outline" className="gap-1.5 hidden sm:flex">
                  <Eye className="h-3.5 w-3.5" /> Full Preview
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {showPreview ? (
            <ResumePreview resume={resume} />
          ) : (
            <div className="flex gap-6">
              {/* Sidebar */}
              <aside className="hidden lg:flex w-52 shrink-0 flex-col gap-1">
                {SECTIONS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(s.key)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left
                      ${activeSection === s.key
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                  >
                    <s.icon className="h-4 w-4 shrink-0" />
                    {s.label}
                  </button>
                ))}
              </aside>

              {/* Mobile section picker */}
              <div className="lg:hidden w-full mb-4">
                <select
                  value={activeSection}
                  onChange={e => setActiveSection(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-indigo-500"
                >
                  {SECTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>

              {/* Editor panel */}
              <div className="flex-1 min-w-0">
                {activeSection === 'personal' && (
                  <PersonalSection data={resume.personal_info} onChange={v => update({ personal_info: v })} />
                )}
                {activeSection === 'summary' && (
                  <SummarySection
                    value={resume.summary}
                    onChange={v => update({ summary: v })}
                    onImprove={() => improveSection('summary')}
                    improving={improvingSection === 'summary'}
                  />
                )}
                {activeSection === 'work' && (
                  <WorkSection
                    items={resume.work_experience}
                    onChange={v => update({ work_experience: v })}
                    resumeId={id}
                    toast={toast}
                  />
                )}
                {activeSection === 'education' && (
                  <EducationSection items={resume.education} onChange={v => update({ education: v })} />
                )}
                {activeSection === 'skills' && (
                  <SkillsSection
                    data={resume.skills}
                    onChange={v => update({ skills: v })}
                    onImprove={() => improveSection('skills')}
                    improving={improvingSection === 'skills'}
                  />
                )}
                {activeSection === 'certifications' && (
                  <CertSection items={resume.certifications} onChange={v => update({ certifications: v })} />
                )}
                {activeSection === 'projects' && (
                  <ProjectSection items={resume.projects} onChange={v => update({ projects: v })} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Section components ───────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-5">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full rounded-xl border-2 border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors"

function PersonalSection({ data, onChange }: { data: PersonalInfo; onChange: (v: PersonalInfo) => void }) {
  const set = (k: keyof PersonalInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...data, [k]: e.target.value })
  return (
    <SectionCard title="Personal Information">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name"><input value={data.name} onChange={set('name')} className={inputCls} placeholder="Priya Sharma" /></Field>
        <Field label="Email"><input value={data.email} onChange={set('email')} className={inputCls} placeholder="priya@example.com" /></Field>
        <Field label="Phone"><input value={data.phone} onChange={set('phone')} className={inputCls} placeholder="+91 98765 43210" /></Field>
        <Field label="Location"><input value={data.location} onChange={set('location')} className={inputCls} placeholder="Mumbai, Maharashtra" /></Field>
        <Field label="LinkedIn URL"><input value={data.linkedin} onChange={set('linkedin')} className={inputCls} placeholder="linkedin.com/in/priya-sharma" /></Field>
        <Field label="GitHub URL"><input value={data.github} onChange={set('github')} className={inputCls} placeholder="github.com/priyasharma" /></Field>
        <Field label="Website / Portfolio (optional)">
          <input value={data.website} onChange={set('website')} className={`${inputCls} sm:col-span-2`} placeholder="priyasharma.dev" />
        </Field>
      </div>
    </SectionCard>
  )
}

function SummarySection({ value, onChange, onImprove, improving }: {
  value: string; onChange: (v: string) => void; onImprove: () => void; improving: boolean
}) {
  return (
    <SectionCard title="Professional Summary">
      <p className="text-xs text-gray-400 mb-3">3–4 sentences. What you do, your experience level, top skills, and what you bring.</p>
      <textarea
        rows={5}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${inputCls} resize-none`}
        placeholder="Experienced software engineer with 4+ years building scalable backend systems..."
      />
      <button
        onClick={onImprove}
        disabled={improving || !value.trim()}
        className="mt-3 flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
      >
        {improving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        Improve with AI
      </button>
    </SectionCard>
  )
}

function WorkSection({ items, onChange, resumeId, toast }: {
  items: WorkExp[]; onChange: (v: WorkExp[]) => void
  resumeId: string; toast: ReturnType<typeof useToast>['toast']
}) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null)
  const [improving, setImproving] = useState('')

  function addExp() {
    const id = newId()
    const updated = [...items, { id, company: '', role: '', location: '', start_date: '', end_date: '', is_current: false, bullets: [''] }]
    onChange(updated)
    setOpen(id)
  }

  function updateExp(id: string, patch: Partial<WorkExp>) {
    onChange(items.map(x => x.id === id ? { ...x, ...patch } : x))
  }

  function removeExp(id: string) {
    onChange(items.filter(x => x.id !== id))
  }

  async function improveBullets(expId: string) {
    setImproving(expId)
    const exp = items.find(x => x.id === expId)
    if (!exp) { setImproving(''); return }
    const res = await fetch(`/api/resume/${resumeId}/improve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'work_bullets', content: exp.bullets, targetRole: exp.role }),
    })
    const data = await res.json()
    if (Array.isArray(data.improved)) {
      updateExp(expId, { bullets: data.improved })
      toast({ title: 'Bullets improved!' })
    }
    setImproving('')
  }

  return (
    <SectionCard title="Work Experience">
      <div className="flex flex-col gap-3">
        {items.map(exp => (
          <div key={exp.id} className="rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setOpen(open === exp.id ? null : exp.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <span>{exp.company ? `${exp.role} @ ${exp.company}` : 'New Position'}</span>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); removeExp(exp.id) }} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {open === exp.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </div>
            </button>
            {open === exp.id && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-100 flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Job Title"><input value={exp.role} onChange={e => updateExp(exp.id, { role: e.target.value })} className={inputCls} placeholder="Software Engineer" /></Field>
                  <Field label="Company"><input value={exp.company} onChange={e => updateExp(exp.id, { company: e.target.value })} className={inputCls} placeholder="Infosys" /></Field>
                  <Field label="Location"><input value={exp.location} onChange={e => updateExp(exp.id, { location: e.target.value })} className={inputCls} placeholder="Bengaluru, India" /></Field>
                  <Field label="Start Date"><input value={exp.start_date} onChange={e => updateExp(exp.id, { start_date: e.target.value })} className={inputCls} placeholder="Jan 2022" /></Field>
                  <Field label="End Date">
                    <input
                      value={exp.is_current ? 'Present' : exp.end_date}
                      onChange={e => updateExp(exp.id, { end_date: e.target.value })}
                      disabled={exp.is_current}
                      className={`${inputCls} disabled:opacity-50`}
                      placeholder="Dec 2023"
                    />
                  </Field>
                  <Field label="Current Role">
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input type="checkbox" checked={exp.is_current} onChange={e => updateExp(exp.id, { is_current: e.target.checked })} className="rounded" />
                      <span className="text-sm text-gray-600">I currently work here</span>
                    </label>
                  </Field>
                </div>
                <Field label="Bullet Points (one per line, use XYZ formula)">
                  {exp.bullets.map((b, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        value={b}
                        onChange={e => {
                          const bullets = [...exp.bullets]
                          bullets[i] = e.target.value
                          updateExp(exp.id, { bullets })
                        }}
                        className={inputCls}
                        placeholder="Reduced API latency by 40% by implementing Redis caching"
                      />
                      <button onClick={() => updateExp(exp.id, { bullets: exp.bullets.filter((_, j) => j !== i) })} className="text-gray-300 hover:text-red-500 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateExp(exp.id, { bullets: [...exp.bullets, ''] })}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add bullet
                  </button>
                </Field>
                <button
                  onClick={() => improveBullets(exp.id)}
                  disabled={improving === exp.id || exp.bullets.every(b => !b.trim())}
                  className="self-start flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {improving === exp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Improve bullets with AI
                </button>
              </div>
            )}
          </div>
        ))}
        <button onClick={addExp} className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
          <Plus className="h-4 w-4" /> Add position
        </button>
      </div>
    </SectionCard>
  )
}

function EducationSection({ items, onChange }: { items: Education[]; onChange: (v: Education[]) => void }) {
  function add() { onChange([...items, { id: newId(), institution: '', degree: '', field: '', graduation_year: '', grade: '' }]) }
  function update(id: string, patch: Partial<Education>) { onChange(items.map(x => x.id === id ? { ...x, ...patch } : x)) }
  function remove(id: string) { onChange(items.filter(x => x.id !== id)) }

  return (
    <SectionCard title="Education">
      <div className="flex flex-col gap-4">
        {items.map(ed => (
          <div key={ed.id} className="rounded-xl border border-gray-200 p-4">
            <div className="flex justify-end mb-3">
              <button onClick={() => remove(ed.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Institution"><input value={ed.institution} onChange={e => update(ed.id, { institution: e.target.value })} className={inputCls} placeholder="IIT Delhi" /></Field>
              <Field label="Degree"><input value={ed.degree} onChange={e => update(ed.id, { degree: e.target.value })} className={inputCls} placeholder="B.Tech" /></Field>
              <Field label="Field of Study"><input value={ed.field} onChange={e => update(ed.id, { field: e.target.value })} className={inputCls} placeholder="Computer Science" /></Field>
              <Field label="Graduation Year"><input value={ed.graduation_year} onChange={e => update(ed.id, { graduation_year: e.target.value })} className={inputCls} placeholder="2023" /></Field>
              <Field label="Grade / CGPA (optional)"><input value={ed.grade} onChange={e => update(ed.id, { grade: e.target.value })} className={inputCls} placeholder="8.5 / 10" /></Field>
            </div>
          </div>
        ))}
        <button onClick={add} className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
          <Plus className="h-4 w-4" /> Add education
        </button>
      </div>
    </SectionCard>
  )
}

function SkillsSection({ data, onChange, onImprove, improving }: {
  data: Skills; onChange: (v: Skills) => void; onImprove: () => void; improving: boolean
}) {
  function parseList(s: string): string[] { return s.split(',').map(x => x.trim()).filter(Boolean) }

  return (
    <SectionCard title="Skills">
      <div className="flex flex-col gap-4">
        <Field label="Technical Skills (comma-separated)">
          <textarea
            rows={3}
            value={data.technical.join(', ')}
            onChange={e => onChange({ ...data, technical: parseList(e.target.value) })}
            className={`${inputCls} resize-none`}
            placeholder="Python, React, Node.js, PostgreSQL, Docker, AWS"
          />
        </Field>
        <Field label="Soft Skills (comma-separated)">
          <textarea
            rows={2}
            value={data.soft.join(', ')}
            onChange={e => onChange({ ...data, soft: parseList(e.target.value) })}
            className={`${inputCls} resize-none`}
            placeholder="Leadership, Communication, Problem Solving, Team Collaboration"
          />
        </Field>
        <button
          onClick={onImprove}
          disabled={improving || (data.technical.length === 0 && data.soft.length === 0)}
          className="self-start flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          {improving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Suggest missing skills with AI
        </button>
      </div>
    </SectionCard>
  )
}

function CertSection({ items, onChange }: { items: Certification[]; onChange: (v: Certification[]) => void }) {
  function add() { onChange([...items, { id: newId(), name: '', issuer: '', year: '' }]) }
  function update(id: string, patch: Partial<Certification>) { onChange(items.map(x => x.id === id ? { ...x, ...patch } : x)) }
  function remove(id: string) { onChange(items.filter(x => x.id !== id)) }

  return (
    <SectionCard title="Certifications">
      <div className="flex flex-col gap-3">
        {items.map(c => (
          <div key={c.id} className="rounded-xl border border-gray-200 p-4">
            <div className="flex justify-end mb-3"><button onClick={() => remove(c.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Certification Name"><input value={c.name} onChange={e => update(c.id, { name: e.target.value })} className={inputCls} placeholder="AWS Solutions Architect" /></Field>
              <Field label="Issuing Organization"><input value={c.issuer} onChange={e => update(c.id, { issuer: e.target.value })} className={inputCls} placeholder="Amazon Web Services" /></Field>
              <Field label="Year"><input value={c.year} onChange={e => update(c.id, { year: e.target.value })} className={inputCls} placeholder="2023" /></Field>
            </div>
          </div>
        ))}
        <button onClick={add} className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
          <Plus className="h-4 w-4" /> Add certification
        </button>
      </div>
    </SectionCard>
  )
}

function ProjectSection({ items, onChange }: { items: Project[]; onChange: (v: Project[]) => void }) {
  function add() { onChange([...items, { id: newId(), name: '', description: '', link: '', tech: [] }]) }
  function update(id: string, patch: Partial<Project>) { onChange(items.map(x => x.id === id ? { ...x, ...patch } : x)) }
  function remove(id: string) { onChange(items.filter(x => x.id !== id)) }

  return (
    <SectionCard title="Projects">
      <div className="flex flex-col gap-4">
        {items.map(p => (
          <div key={p.id} className="rounded-xl border border-gray-200 p-4">
            <div className="flex justify-end mb-3"><button onClick={() => remove(p.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Project Name"><input value={p.name} onChange={e => update(p.id, { name: e.target.value })} className={inputCls} placeholder="CareerSetu" /></Field>
              <Field label="Live URL / GitHub Link"><input value={p.link} onChange={e => update(p.id, { link: e.target.value })} className={inputCls} placeholder="github.com/you/project" /></Field>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea rows={3} value={p.description} onChange={e => update(p.id, { description: e.target.value })} className={`${inputCls} resize-none`} placeholder="AI-powered mock interview platform built with Next.js and Supabase..." />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Tech Stack (comma-separated)">
                  <input
                    value={p.tech.join(', ')}
                    onChange={e => update(p.id, { tech: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                    className={inputCls}
                    placeholder="Next.js, TypeScript, Supabase, Claude API"
                  />
                </Field>
              </div>
            </div>
          </div>
        ))}
        <button onClick={add} className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
          <Plus className="h-4 w-4" /> Add project
        </button>
      </div>
    </SectionCard>
  )
}
