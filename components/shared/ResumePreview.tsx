import { Globe, Phone, Mail, MapPin } from 'lucide-react'

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
    </svg>
  )
}
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
    </svg>
  )
}

interface ResumeData {
  title: string
  personal_info: {
    name: string; email: string; phone: string; location: string
    linkedin: string; github: string; website: string
  }
  summary: string
  work_experience: Array<{
    id: string; company: string; role: string; location: string
    start_date: string; end_date: string; is_current: boolean; bullets: string[]
  }>
  education: Array<{
    id: string; institution: string; degree: string; field: string
    graduation_year: string; grade: string
  }>
  skills: { technical: string[]; soft: string[] }
  certifications: Array<{ id: string; name: string; issuer: string; year: string }>
  projects: Array<{ id: string; name: string; description: string; link: string; tech: string[] }>
}

interface Props {
  resume: ResumeData
  printMode?: boolean
}

export default function ResumePreview({ resume, printMode = false }: Props) {
  const p = resume.personal_info
  const hasSomething = p.name || resume.summary || resume.work_experience.length > 0

  if (!hasSomething) {
    return (
      <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center text-gray-400 text-sm">
        Fill in some details to see your resume preview here.
      </div>
    )
  }

  const containerCls = printMode
    ? 'bg-white text-gray-900 font-sans'
    : 'bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden'

  return (
    <div className={containerCls}>
      <div className="p-8 sm:p-10 max-w-3xl mx-auto resume-print">
        {/* Header */}
        <div className="border-b-2 border-indigo-600 pb-5 mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {p.name || 'Your Name'}
          </h1>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
            {p.email && (
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span>
            )}
            {p.phone && (
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span>
            )}
            {p.location && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location}</span>
            )}
            {p.linkedin && (
              <span className="flex items-center gap-1"><LinkedinIcon className="h-3 w-3" />{p.linkedin.replace('https://', '').replace('http://', '')}</span>
            )}
            {p.github && (
              <span className="flex items-center gap-1"><GithubIcon className="h-3 w-3" />{p.github.replace('https://', '').replace('http://', '')}</span>
            )}
            {p.website && (
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{p.website.replace('https://', '').replace('http://', '')}</span>
            )}
          </div>
        </div>

        {/* Summary */}
        {resume.summary && (
          <Section title="Professional Summary">
            <p className="text-sm text-gray-700 leading-relaxed">{resume.summary}</p>
          </Section>
        )}

        {/* Work Experience */}
        {resume.work_experience.length > 0 && (
          <Section title="Work Experience">
            <div className="flex flex-col gap-5">
              {resume.work_experience.map(exp => (
                <div key={exp.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{exp.role || 'Role'}</p>
                      <p className="text-xs text-gray-500">{[exp.company, exp.location].filter(Boolean).join(' · ')}</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0 mt-0.5">
                      {[exp.start_date, exp.is_current ? 'Present' : exp.end_date].filter(Boolean).join(' – ')}
                    </p>
                  </div>
                  {exp.bullets.filter(b => b.trim()).length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {exp.bullets.filter(b => b.trim()).map((b, i) => (
                        <li key={i} className="flex gap-2 text-xs text-gray-700">
                          <span className="text-indigo-500 shrink-0 mt-0.5">▸</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <Section title="Education">
            <div className="flex flex-col gap-3">
              {resume.education.map(ed => (
                <div key={ed.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{[ed.degree, ed.field].filter(Boolean).join(' in ')}</p>
                    <p className="text-xs text-gray-500">{ed.institution}{ed.grade ? ` · ${ed.grade}` : ''}</p>
                  </div>
                  {ed.graduation_year && <p className="text-xs text-gray-400 shrink-0">{ed.graduation_year}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Skills */}
        {(resume.skills.technical.length > 0 || resume.skills.soft.length > 0) && (
          <Section title="Skills">
            <div className="flex flex-col gap-2">
              {resume.skills.technical.length > 0 && (
                <div className="flex gap-2 text-xs">
                  <span className="font-semibold text-gray-700 shrink-0 w-20">Technical:</span>
                  <span className="text-gray-600">{resume.skills.technical.join(' · ')}</span>
                </div>
              )}
              {resume.skills.soft.length > 0 && (
                <div className="flex gap-2 text-xs">
                  <span className="font-semibold text-gray-700 shrink-0 w-20">Soft:</span>
                  <span className="text-gray-600">{resume.skills.soft.join(' · ')}</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <Section title="Projects">
            <div className="flex flex-col gap-4">
              {resume.projects.map(proj => (
                <div key={proj.id}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{proj.name}</p>
                    {proj.link && (
                      <a href={proj.link} className="text-xs text-indigo-500 hover:underline shrink-0">
                        {proj.link.replace('https://', '').replace('http://', '')}
                      </a>
                    )}
                  </div>
                  {proj.description && <p className="mt-1 text-xs text-gray-700">{proj.description}</p>}
                  {proj.tech.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {proj.tech.map(t => (
                        <span key={t} className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <Section title="Certifications">
            <div className="flex flex-col gap-1.5">
              {resume.certifications.map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-800">{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
                  {c.year && <span className="text-gray-400">{c.year}</span>}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 border-b border-gray-200 pb-1 mb-3">{title}</h2>
      {children}
    </div>
  )
}
