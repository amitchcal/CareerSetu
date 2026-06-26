'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Volume2, RotateCcw, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import ProgressIndicator from '@/components/shared/ProgressIndicator'
import VoiceRecorder from '@/components/shared/VoiceRecorder'

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState =
  | 'auth_loading'
  | 'intro'
  | 'question_loading'
  | 'question'
  | 'feedback_loading'
  | 'feedback'

// ─── SpeechSynthesis helpers ──────────────────────────────────────────────────

function speak(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'en-IN'
  utt.rate = 0.95
  if (onEnd) utt.onend = onEnd
  window.speechSynthesis.speak(utt)
}

function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SampleInterviewPage() {
  const router = useRouter()

  const [pageState, setPageState] = useState<PageState>('auth_loading')
  const [targetRole, setTargetRole] = useState('a general role')
  const [question, setQuestion] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState('')
  const [feedbackError, setFeedbackError] = useState('')

  // Auth check + load target_role
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      const { data: user } = await supabase
        .from('users')
        .select('target_role')
        .eq('id', session.user.id)
        .maybeSingle()

      if (user?.target_role) setTargetRole(user.target_role)
      setPageState('intro')
    }
    init()
  }, [router])

  // ── Fetch question ─────────────────────────────────────────────────────────

  async function handleStart() {
    setPageState('question_loading')
    try {
      const res = await fetch('/api/interview/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate question.')

      setQuestion(data.question)
      setAudioBlob(null)
      setPageState('question')

      // Auto-play question
      setIsSpeaking(true)
      speak(data.question, () => setIsSpeaking(false))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load question.'
      toast({ title: 'Error', description: message, variant: 'destructive' })
      setPageState('intro')
    }
  }

  // ── TTS replay ──────────────────────────────────────────────────────────────

  function handleSpeak() {
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
      return
    }
    setIsSpeaking(true)
    speak(question, () => setIsSpeaking(false))
  }

  // ── VoiceRecorder callback ─────────────────────────────────────────────────

  const handleRecordingComplete = useCallback((blob: Blob) => {
    setAudioBlob(blob)
  }, [])

  // ── Submit recording for STT + feedback ───────────────────────────────────

  async function handleSubmitAnswer(blob: Blob) {
    stopSpeaking()
    setIsSpeaking(false)
    setFeedbackError('')
    setPageState('feedback_loading')

    try {
      const form = new FormData()
      form.append('audio', blob, 'answer.webm')
      form.append('question', question)
      form.append('targetRole', targetRole)

      const res = await fetch('/api/interview/sample/feedback', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Could not analyse your answer.')

      setTranscript(data.transcript)
      setFeedback(data.feedback)
      setPageState('feedback')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setFeedbackError(message)
      toast({ title: 'Analysis failed', description: message, variant: 'destructive' })
      setPageState('question')
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  function goToDashboard() {
    stopSpeaking()
    router.push('/dashboard')
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (pageState === 'auth_loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Progress */}
      <div className="mb-6">
        <ProgressIndicator step={3} total={3} label="Step 3 of 3 — Sample question" />
      </div>

      {/* Skip link */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={goToDashboard}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip for now →
        </button>
      </div>

      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      {pageState === 'intro' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
            <span className="text-2xl">🎤</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Try a quick question</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Let&apos;s try one question — just to show you how it works. It takes about 2 minutes.
          </p>
          <button
            onClick={handleStart}
            className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98]"
          >
            Start
          </button>
        </div>
      )}

      {/* ── Question loading ──────────────────────────────────────────────── */}
      {pageState === 'question_loading' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600 mb-4" />
          <p className="text-sm text-gray-500">Preparing your question…</p>
        </div>
      )}

      {/* ── Question + recorder ───────────────────────────────────────────── */}
      {pageState === 'question' && (
        <div className="flex flex-col gap-4">
          {/* Question card */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                Your question
              </span>
              <button
                onClick={handleSpeak}
                title={isSpeaking ? 'Stop' : 'Read aloud'}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                <Volume2 className={`h-3.5 w-3.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                {isSpeaking ? 'Playing…' : 'Read aloud'}
              </button>
            </div>
            <p className="text-base font-medium text-gray-900 leading-relaxed">{question}</p>
          </div>

          {/* Recorder */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-4">Record your answer</p>
            <VoiceRecorder
              onComplete={handleRecordingComplete}
              maxDuration={90}
            />
          </div>

          {/* Submit — visible once recording is confirmed */}
          {audioBlob && (
            <button
              onClick={() => handleSubmitAnswer(audioBlob)}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98]"
            >
              Analyse my answer
            </button>
          )}

          {/* Error + retry */}
          {feedbackError && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{feedbackError}</p>
              {audioBlob && (
                <button
                  onClick={() => handleSubmitAnswer(audioBlob)}
                  className="ml-3 flex shrink-0 items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Feedback loading ──────────────────────────────────────────────── */}
      {pageState === 'feedback_loading' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600 mb-4" />
          <p className="text-sm font-medium text-gray-700 mb-1">Analysing your answer…</p>
          <p className="text-xs text-gray-400">Transcribing speech and generating feedback</p>
        </div>
      )}

      {/* ── Feedback ─────────────────────────────────────────────────────── */}
      {pageState === 'feedback' && (
        <div className="flex flex-col gap-4">
          {/* Question recap */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Question asked
            </p>
            <p className="text-sm text-gray-600">{question}</p>
          </div>

          {/* Transcript */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Your answer (transcript)
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {transcript || (
                <span className="italic text-gray-400">No speech detected</span>
              )}
            </p>
          </div>

          {/* Feedback */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 sm:p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400 mb-2">
              AI Feedback
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">{feedback}</p>
          </div>

          {/* CTA */}
          <button
            onClick={goToDashboard}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98]"
          >
            Start a full mock interview
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-center text-xs text-gray-400">
            That was 1 question. A full interview has 5–10.
          </p>
        </div>
      )}
    </div>
  )
}
