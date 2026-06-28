'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft,
  ChevronDown, ChevronUp, Copy, Check, Loader2, TrendingUp,
  Tag, Lightbulb, XCircle
} from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import { toast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'

interface GapArea {
  category: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

interface AnalysisResult {
  matchScore: number
  gapAreas: GapArea[]
  missingKeywords: string[]
  presentKeywords: string[]
  rewrittenCV: string
  improvementTips: string[]
}

const ACCEPTED = '.pdf,.doc,.docx'

function FileDropZone({
  label, hint, file, onChange,
}: {
  label: string
  hint: string
  file: File | null
  onChange: (f: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) onChange(dropped)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors text-center ${
        dragging ? 'border-indigo-500 bg-indigo-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-indigo-400 bg-white'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f) }}
      />
      {file ? (
        <div className="flex items-center justify-center gap-2 text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm truncate max-w-xs">{file.name}</span>
        </div>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="font-semibold text-gray-700 text-sm">{label}</p>
          <p className="text-gray-400 text-xs mt-1">{hint}</p>
        </>
      )}
    </div>
  )
}

function ScoreMeter({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-500' : 'text-red-500'
  const ring = score >= 70 ? 'stroke-green-500' : score >= 40 ? 'stroke-amber-400' : 'stroke-red-400'
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none" className={ring} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 48 48)"
        />
        <text x="48" y="48" textAnchor="middle" dominantBaseline="central" className={`text-xl font-bold ${color}`} style={{ fontSize: 20 }}>
          {score}
        </text>
      </svg>
      <span className="text-xs text-gray-500">Match Score</span>
    </div>
  )
}

const SEVERITY_CONFIG = {
  high: { label: 'High', cls: 'bg-red-100 text-red-700', icon: XCircle },
  medium: { label: 'Medium', cls: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  low: { label: 'Low', cls: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
}

export default function CVAnalyzerPage() {
  const router = useRouter()
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login')
    })
  }, [router])
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [cvExpanded, setCvExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleAnalyze() {
    if (!jdFile || !cvFile) {
      toast({ title: 'Missing files', description: 'Please upload both the JD and your CV.', variant: 'destructive' })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('jd', jdFile)
      fd.append('cv', cvFile)
      const res = await fetch('/api/cv-analyzer', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed.')
      setResult(data)
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  function copyCV() {
    if (!result) return
    navigator.clipboard.writeText(result.rewrittenCV)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isLoggedIn />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">CV Analyzer</h1>
          <p className="text-gray-500 mt-1 text-sm">Upload your JD and CV to find gaps and get an optimized resume tailored to the role.</p>
        </div>

        {/* Upload section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Job Description</p>
              <FileDropZone
                label="Upload JD"
                hint="PDF, DOC, or DOCX · drag & drop or click"
                file={jdFile}
                onChange={setJdFile}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your CV / Resume</p>
              <FileDropZone
                label="Upload CV"
                hint="PDF, DOC, or DOCX · drag & drop or click"
                file={cvFile}
                onChange={setCvFile}
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !jdFile || !cvFile}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><TrendingUp className="w-4 h-4" /> Analyze My CV</>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-5">
            {/* Score + summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-6">
              <ScoreMeter score={result.matchScore} />
              <div className="flex-1">
                <h2 className="font-bold text-gray-900 text-lg mb-1">
                  {result.matchScore >= 70 ? 'Good match!' : result.matchScore >= 40 ? 'Needs improvement' : 'Low match — significant gaps found'}
                </h2>
                <p className="text-sm text-gray-500">
                  Your CV matches <span className="font-semibold text-gray-700">{result.matchScore}%</span> of the JD requirements.
                  {result.missingKeywords.length > 0 && ` ${result.missingKeywords.length} key terms are missing.`}
                </p>
              </div>
            </div>

            {/* Gap areas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" /> Gap Analysis
              </h3>
              {result.gapAreas.length === 0 ? (
                <p className="text-sm text-gray-500">No significant gaps found.</p>
              ) : (
                <div className="space-y-3">
                  {result.gapAreas.map((g, i) => {
                    const cfg = SEVERITY_CONFIG[g.severity]
                    const Icon = cfg.icon
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-xs font-semibold text-gray-700">{g.category}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                          </div>
                          <p className="text-sm text-gray-600">{g.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Keywords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-red-400" /> Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((kw, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">{kw}</span>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-green-500" /> Present Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.presentKeywords.map((kw, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">{kw}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tips */}
            {result.improvementTips.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2 text-sm">
                  <Lightbulb className="w-4 h-4" /> Improvement Tips
                </h3>
                <ul className="space-y-2">
                  {result.improvementTips.map((tip, i) => (
                    <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                      <span className="font-bold mt-0.5">{i + 1}.</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rewritten CV */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" /> Optimized CV
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyCV}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                  <button
                    onClick={() => setCvExpanded(!cvExpanded)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    {cvExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Collapse</> : <><ChevronDown className="w-3.5 h-3.5" /> Expand</>}
                  </button>
                </div>
              </div>
              <div className={`overflow-hidden transition-all ${cvExpanded ? '' : 'max-h-64'}`}>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {result.rewrittenCV}
                </pre>
              </div>
              {!cvExpanded && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                  <button onClick={() => setCvExpanded(true)} className="text-xs text-indigo-600 hover:underline">Show full CV</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
