'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Mic, MicOff, Loader2, Volume2, CheckCircle2, ChevronRight, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import Navbar from '@/components/shared/Navbar'

type Phase = 'loading' | 'speaking' | 'listening' | 'processing' | 'complete'

interface SessionMeta {
  role: string
  numQuestions: number
}

function speakText(text: string): Promise<void> {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-IN'
    utterance.rate = 0.92
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}

export default function InterviewSessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [phase, setPhase] = useState<Phase>('loading')
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionNumber, setQuestionNumber] = useState(1)
  const [transcript, setTranscript] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Load session and first question
  useEffect(() => {
    async function init() {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) { router.replace('/login'); return }

      const { data: sess } = await supabase
        .from('sessions')
        .select('role, num_questions')
        .eq('id', sessionId)
        .single()

      if (!sess) { router.replace('/dashboard'); return }
      setSessionMeta({ role: sess.role, numQuestions: sess.num_questions })

      // Try sessionStorage first (set by interview/new page), fall back to DB
      let firstQuestionText = sessionStorage.getItem(`interview_q1_${sessionId}`)
      sessionStorage.removeItem(`interview_q1_${sessionId}`)

      if (!firstQuestionText) {
        const { data: q1 } = await supabase
          .from('session_questions')
          .select('question_text')
          .eq('session_id', sessionId)
          .eq('question_number', 1)
          .single()
        firstQuestionText = q1?.question_text ?? null
      }

      if (!firstQuestionText) { toast({ title: 'Error', description: 'Could not load first question.', variant: 'destructive' }); return }

      setCurrentQuestion(firstQuestionText)
      setPhase('speaking')
      await speakText(q1.question_text)
      setPhase('listening')
      await startRecording()
    }
    init()
    return () => {
      window.speechSynthesis.cancel()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioChunksRef.current = []
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.start(250)
    } catch {
      toast({ title: 'Microphone error', description: 'Please allow microphone access and try again.', variant: 'destructive' })
    }
  }

  const stopAndSubmit = useCallback(async () => {
    if (phase !== 'listening') return
    setPhase('processing')

    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      await new Promise<void>((resolve) => { mr.onstop = () => resolve(); mr.stop() })
    }
    streamRef.current?.getTracks().forEach(t => t.stop())

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
    const fd = new FormData()
    fd.append('questionNumber', String(questionNumber))
    fd.append('audio', audioBlob, 'answer.webm')

    try {
      const res = await fetch(`/api/interview/${sessionId}/answer`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setTranscript(data.transcript ?? '')

      if (data.isComplete) {
        setPhase('complete')
        // Generate feedback
        await fetch(`/api/interview/${sessionId}/feedback`, {
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
      await speakText(nextQ)
      setPhase('listening')
      await startRecording()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      toast({ title: 'Error', description: message, variant: 'destructive' })
      setPhase('listening')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, questionNumber, sessionId])

  const numQ = sessionMeta?.numQuestions ?? 1
  const progress = Math.round(((questionNumber - 1) / numQ) * 100)

  async function handleEndEarly() {
    window.speechSynthesis.cancel()
    streamRef.current?.getTracks().forEach(t => t.stop())
    await supabase.from('sessions').update({ status: 'abandoned' }).eq('id', sessionId)
    router.push('/dashboard')
  }

  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-xl px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{sessionMeta?.role ?? 'Interview'}</p>
            <h1 className="text-lg font-bold text-gray-900">
              Question {questionNumber} <span className="text-gray-400 font-normal">of {numQ}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-3 py-1">
              {phase === 'loading' ? 'Loading…' : phase === 'speaking' ? 'AI Speaking' : phase === 'listening' ? 'Your turn' : phase === 'processing' ? 'Processing…' : 'Done'}
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

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Question card */}
        <div className={`rounded-2xl border-2 bg-white p-6 shadow-sm transition-colors ${
          phase === 'speaking' ? 'border-indigo-300' : 'border-gray-200'
        }`}>
          {phase === 'loading' ? (
            <div className="flex items-center gap-3 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading your interview…</span>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-2">
                {phase === 'speaking' && <Volume2 className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />}
                <p className="text-base font-medium text-gray-900 leading-relaxed">{currentQuestion}</p>
              </div>
              {phase === 'speaking' && (
                <p className="text-xs text-indigo-400 mt-3">AI interviewer is reading the question…</p>
              )}
            </>
          )}
        </div>

        {/* Transcript preview */}
        {transcript && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 mb-1">Your answer (transcript)</p>
            <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* Mic button */}
        {(phase === 'listening' || phase === 'processing') && (
          <div className="flex flex-col items-center gap-4 py-4">
            <button
              onClick={stopAndSubmit}
              disabled={phase === 'processing'}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-60 ${
                phase === 'listening'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gray-300'
              }`}
            >
              {phase === 'processing' ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <>
                  <Mic className="h-8 w-8 text-white" />
                  {/* Pulse ring */}
                  <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
                </>
              )}
            </button>
            <p className="text-sm text-gray-500">
              {phase === 'listening' ? 'Tap when you finish answering' : 'Processing your answer…'}
            </p>
          </div>
        )}

        {phase === 'speaking' && (
          <div className="flex justify-center py-4">
            <MicOff className="h-6 w-6 text-gray-300" />
          </div>
        )}

        {/* Complete state */}
        {phase === 'complete' && (
          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Interview complete!</h2>
              <p className="text-sm text-gray-500 mt-1">Generating your feedback — this takes a few seconds.</p>
            </div>
            <button
              onClick={() => router.push(`/interview/${sessionId}/feedback`)}
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
