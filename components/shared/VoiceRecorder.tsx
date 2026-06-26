'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Square, Play, Pause, RotateCcw, Check, MicOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type RecorderState = 'idle' | 'requesting' | 'recording' | 'stopped' | 'permission_denied' | 'unsupported'

interface VoiceRecorderProps {
  onComplete: (audioBlob: Blob) => void
  maxDuration?: number
  className?: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function VoiceRecorder({
  onComplete,
  maxDuration = 90,
  className,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [maxReached, setMaxReached] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)

  // Check browser support once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setState('unsupported')
    }
  }, [])

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      stopTimer()
      releaseStream()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function releaseStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const stopRecording = useCallback((autoStopped = false) => {
    stopTimer()
    if (autoStopped) setMaxReached(true)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    releaseStream()
  }, [])

  async function startRecording() {
    setMaxReached(false)
    setState('requesting')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setState('permission_denied')
      return
    }

    streamRef.current = stream
    chunksRef.current = []

    // Pick a broadly-supported MIME type
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
      .find((m) => MediaRecorder.isTypeSupported(m)) ?? ''

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
      audioBlobRef.current = blob
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setState('stopped')
    }

    recorder.start(250) // collect data every 250ms for smoother stop
    setState('recording')
    setElapsed(0)

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1
        if (next >= maxDuration) {
          stopRecording(true)
        }
        return next
      })
    }, 1000)
  }

  function handleMainButton() {
    if (state === 'idle' || state === 'permission_denied') {
      startRecording()
    } else if (state === 'recording') {
      stopRecording(false)
    }
  }

  function handleReRecord() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    audioBlobRef.current = null
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current.src = ''
    }
    setIsPlaying(false)
    setElapsed(0)
    setMaxReached(false)
    setState('idle')
  }

  function handleConfirm() {
    if (audioBlobRef.current) {
      onComplete(audioBlobRef.current)
    }
  }

  function togglePlayback() {
    const el = audioElRef.current
    if (!el) return
    if (isPlaying) {
      el.pause()
    } else {
      el.play()
    }
  }

  // Unsupported browser
  if (state === 'unsupported') {
    return (
      <div className={cn('flex flex-col items-center gap-4 p-6 text-center', className)}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <MicOff className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Browser not supported</p>
          <p className="mt-1 text-sm text-gray-500">
            Please use Chrome, Firefox, or Safari on iOS 14.3+ to record audio.
          </p>
        </div>
      </div>
    )
  }

  // Stopped — show playback + actions
  if (state === 'stopped') {
    return (
      <div className={cn('flex flex-col items-center gap-6', className)}>
        {maxReached && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Maximum recording length reached ({formatTime(maxDuration)})
          </div>
        )}

        {/* Playback button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={togglePlayback}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
            aria-label={isPlaying ? 'Pause' : 'Play recording'}
          >
            {isPlaying
              ? <Pause className="h-8 w-8" />
              : <Play className="h-8 w-8 ml-1" />
            }
          </button>
          <span className="text-sm font-medium text-gray-500">
            {isPlaying ? 'Playing...' : 'Tap to review'}
          </span>
        </div>

        {/* Hidden audio element */}
        {audioUrl && (
          <audio
            ref={audioElRef}
            src={audioUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}

        {/* Action buttons */}
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-[0.98] transition-all"
          >
            <Check className="h-5 w-5" />
            Use this recording
          </button>
          <button
            onClick={handleReRecord}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3.5 font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Re-record
          </button>
        </div>
      </div>
    )
  }

  // Idle / requesting / recording
  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {/* Permission denied message */}
      {state === 'permission_denied' && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 max-w-xs">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Microphone access denied</p>
            <p className="mt-0.5 text-red-600">
              Please allow microphone access to continue. Check your browser settings and tap below to try again.
            </p>
          </div>
        </div>
      )}

      {/* Main record button */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Pulse rings while recording */}
        {state === 'recording' && (
          <>
            <span className="absolute inline-flex h-28 w-28 rounded-full bg-amber-400 opacity-30 animate-ping" />
            <span className="absolute inline-flex h-36 w-36 rounded-full bg-amber-300 opacity-15 animate-ping [animation-delay:300ms]" />
          </>
        )}

        <button
          onClick={handleMainButton}
          disabled={state === 'requesting'}
          aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
          className={cn(
            'relative z-10 flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed',
            state === 'recording'
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-amber-500 hover:bg-amber-600'
          )}
        >
          {state === 'recording'
            ? <Square className="h-9 w-9 text-white fill-white" />
            : <Mic className="h-9 w-9 text-white" />
          }
        </button>
      </div>

      {/* Status label + timer */}
      <div className="flex flex-col items-center gap-1">
        {state === 'recording' ? (
          <>
            <span className="text-3xl font-mono font-semibold tabular-nums text-gray-900">
              {formatTime(elapsed)}
            </span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-red-500">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Recording...
            </span>
            <span className="text-xs text-gray-400 mt-0.5">
              Max {formatTime(maxDuration)} — tap to stop
            </span>
          </>
        ) : state === 'requesting' ? (
          <span className="text-sm text-gray-500">Requesting microphone access…</span>
        ) : state === 'permission_denied' ? (
          <button
            onClick={startRecording}
            className="mt-1 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
        ) : (
          <span className="text-sm text-gray-500">Tap to start recording</span>
        )}
      </div>
    </div>
  )
}
