'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, Volume2, CheckCircle2, ChevronRight, X, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import Navbar from '@/components/shared/Navbar'
import VideoRecorder from '@/components/shared/VideoRecorder'

type Phase = 'loading' | 'speaking' | 'recording' | 'processing' | 'complete'

interface SessionMeta {
  role: string
  numQuestions: number
  language: string
}

const TOTAL_SESSION_SECS = 600   // 10 minutes
const MAX_ANSWER_SECS    = 120   // 2 minutes per answer

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function getIndianVoice(lang: 'en-IN' | 'hi-IN'): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.lang === lang) ??
    voices.find(v => v.lang.startsWith(lang.split('-')[0]) && (v.name.includes('India') || v.name.includes('Hindi'))) ??
    voices.find(v => v.lang.startsWith(lang.split('-')[0])) ??
    null
  )
}

function speakText(text: string, sessionLang = 'english'): Promise<void> {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const targetLang: 'en-IN' | 'hi-IN' = sessionLang === 'hindi' ? 'hi-IN' : 'en-IN'
    utterance.lang = targetLang
    utterance.rate = 0.92
    const trySpeak = () => {
      const voice = getIndianVoice(targetLang)
      if (voice) utterance.voice = voice
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
    }
    if (window.speechSynthesis.getVoices().length > 0) trySpeak()
    else window.speechSynthesis.onvoiceschanged = () => { trySpeak() }
  })
}

export default function VideoInterviewSessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [phase, setPhase] = useState<Phase>('loading')
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionNumber, setQuestionNumber] = useState(1)
  const [transcript, setTranscript] = useState('')

  // 10-minute session timer
  const [sessionElapsed, setSessionElapsed] = useState(0)
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) { router.replace('/login'); return }

      const { data: sess } = await supabase
        .from('sessions')
        .select('role, num_questions, language')
        .eq('id', sessionId)
        .single()

      if (!sess) { router.replace('/dashboard'); return }
      setSessionMeta({ role: sess.role, numQuestions: sess.num_questions, language: sess.language })

      let firstQuestionText = sessionStorage.getItem(`video_interview_q1_${sessionId}`)
      sessionStorage.removeItem(`video_interview_q1_${sessionId}`)

      if (!firstQuestionText) {
        const { data: q1 } = await supabase
          .from('session_questions')
          .select('question_text')
          .eq('session_id', sessionId)
          .eq('question_number', 1)
          .single()
        firstQuestionText = q1?.question_text ?? null
      }

      if (!firstQuestionText) {
        toast({ title: 'Error', description: 'Could not load first question.', variant: 'destructive' })
        return
      }

      // Start the 10-min session timer
      sessionTimerRef.current = setInterval(() => {
        setSessionElapsed(prev => {
          if (prev + 1 >= TOTAL_SESSION_SECS) {
            clearInterval(sessionTimerRef.current!)
            return TOTAL_SESSION_SECS
          }
          return prev + 1
        })
      }, 1000)

      setCurrentQuestion(firstQuestionText)
      setPhase('speaking')
      await speakText(firstQuestionText, sess.language)
      setPhase('recording')
    }
    init()
    return () => {
      window.speechSynthesis.cancel()
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const handleVideoComplete = useCallback(async (videoBlob: Blob) => {
    setPhase('processing')
    setTranscript('')

    const fd = new FormData()
    fd.append('questionNumber', String(questionNumber))
    fd.append('video', videoBlob, 'answer.webm')

    try {
      const res = await fetch(`/api/video-interview/${sessionId}/answer`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setTranscript(data.transcript ?? '')

      if (data.isComplete) {
        if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
        setPhase('complete')
        await fetch(`/api/video-interview/${sessionId}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        return
      }

      const nextQ = data.nextQuestion as string
      setQuestionNumber(q => q + 1)
      setCurrentQuestion(nextQ)
      setTranscript('')
      setPhase('speaking')
      await speakText(nextQ, sessionMeta?.language)
      setPhase('recording')
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong.', variant: 'destructive' })
      setPhase('recording')
    }
  }, [questionNumber, sessionId, sessionMeta])

  async function handleEndEarly() {
    window.speechSynthesis.cancel()
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
    await supabase.from('sessions').update({ status: 'abandoned' }).eq('id', sessionId)
    router.push('/dashboard')
  }

  const numQ = sessionMeta?.numQuestions ?? 1
  const progress = Math.round(((questionNumber - 1) / numQ) * 100)
  const sessionRemaining = TOTAL_SESSION_SECS - sessionElapsed
  const sessionPct = (sessionElapsed / TOTAL_SESSION_SECS) * 100
  const timerWarning = sessionRemaining <= 120

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-xl px-4 py-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{sessionMeta?.role ?? 'Video Interview'}</p>
            <h1 className="text-lg font-bold text-gray-900">
              Question {questionNumber} <span className="text-gray-400 font-normal">of {numQ}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Session timer */}
            {phase !== 'loading' && phase !== 'complete' && (
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-semibold ${timerWarning ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                <Clock className="h-3 w-3" />
                {fmt(sessionRemaining)}
              </div>
            )}
            <span className={`text-xs font-semibold rounded-full px-3 py-1 ${
              phase === 'speaking' ? 'bg-indigo-50 text-indigo-600' :
              phase === 'recording' ? 'bg-red-50 text-red-600' :
              phase === 'processing' ? 'bg-amber-50 text-amber-600' :
              'bg-gray-100 text-gray-500'
            }`}>
              {phase === 'loading' ? 'Loading…' : phase === 'speaking' ? 'AI Speaking' : phase === 'recording' ? 'Your turn' : phase === 'processing' ? 'Processing…' : 'Done'}
            </span>
            {phase !== 'complete' && phase !== 'loading' && (
              <button
                onClick={handleEndEarly}
                title="End interview"
                className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question progress bar */}
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Session timer bar */}
        {phase !== 'loading' && phase !== 'complete' && (
          <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${timerWarning ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${100 - sessionPct}%` }} />
          </div>
        )}

        {/* Question card */}
        <div className={`rounded-2xl border-2 bg-white p-5 shadow-sm transition-colors ${phase === 'speaking' ? 'border-indigo-300' : 'border-gray-200'}`}>
          {phase === 'loading' ? (
            <div className="flex items-center gap-3 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading your interview…</span>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                {phase === 'speaking' && <Volume2 className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />}
                <p className="text-base font-medium text-gray-900 leading-relaxed">{currentQuestion}</p>
              </div>
              {phase === 'speaking' && (
                <p className="text-xs text-indigo-400 mt-3">AI interviewer is reading the question…</p>
              )}
            </>
          )}
        </div>

        {/* Processing state */}
        {phase === 'processing' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
            <p className="text-sm text-gray-500">Uploading and transcribing your answer…</p>
          </div>
        )}

        {/* Transcript preview */}
        {transcript && phase !== 'processing' && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 mb-1">Your answer (transcript)</p>
            <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* Video recorder */}
        {(phase === 'recording') && (
          <VideoRecorder
            onComplete={handleVideoComplete}
            maxDurationSeconds={MAX_ANSWER_SECS}
          />
        )}

        {/* Complete state */}
        {phase === 'complete' && (
          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Video interview complete!</h2>
              <p className="text-sm text-gray-500 mt-1">Generating your feedback — this takes a few seconds.</p>
            </div>
            <button
              onClick={() => router.push(`/video-interview/${sessionId}/feedback`)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              View Feedback
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </main>
    </>
  )
}
