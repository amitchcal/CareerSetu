'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Video, VideoOff, Loader2, RotateCcw, CheckCircle2, Camera, AlertTriangle, RefreshCw } from 'lucide-react'

type RecorderState = 'idle' | 'requesting' | 'checking' | 'ready' | 'recording' | 'stopped' | 'permission_denied' | 'unsupported'

interface CameraIssue {
  type: 'too_dark' | 'too_bright' | 'no_subject' | 'camera_blocked'
  title: string
  message: string
  tip: string
}

interface Props {
  onComplete: (videoBlob: Blob) => void
  maxDurationSeconds?: number
  disabled?: boolean
}

// Thresholds for luminance (0–255)
const DARK_THRESHOLD   = 35    // avg luminance below this → too dark
const BRIGHT_THRESHOLD = 235   // avg luminance above this → overexposed
const UNIFORM_STDDEV   = 8     // std-dev below this with mid-range avg → camera blocked/covered

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function analyzeFrame(video: HTMLVideoElement): CameraIssue | null {
  try {
    const canvas = document.createElement('canvas')
    // Sample at low resolution for speed
    canvas.width = 80
    canvas.height = 60
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, 80, 60)
    const { data } = ctx.getImageData(0, 0, 80, 60)

    let sum = 0
    let sumSq = 0
    const n = data.length / 4

    for (let i = 0; i < data.length; i += 4) {
      // Perceived luminance formula
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      sum += lum
      sumSq += lum * lum
    }

    const avg = sum / n
    const variance = sumSq / n - avg * avg
    const stddev = Math.sqrt(Math.max(0, variance))

    if (avg < DARK_THRESHOLD) {
      return {
        type: 'too_dark',
        title: 'Too dark — poor lighting detected',
        message: `Average brightness is very low (${Math.round(avg)}/255). The interviewer won't be able to see you clearly.`,
        tip: 'Turn on a light in front of you, face a window, or move to a brighter room.',
      }
    }

    if (avg > BRIGHT_THRESHOLD) {
      return {
        type: 'too_bright',
        title: 'Too bright — overexposed',
        message: `The image is washed out (brightness ${Math.round(avg)}/255). Your face may not be visible.`,
        tip: 'Move away from direct sunlight or bright lights behind the camera. Face the light source instead.',
      }
    }

    // Low std-dev with non-dark avg → camera is blocked / lens is covered
    if (stddev < UNIFORM_STDDEV) {
      return {
        type: 'camera_blocked',
        title: 'Camera appears blocked',
        message: 'The image is almost completely uniform — the camera lens may be covered or pointed at a blank surface.',
        tip: 'Make sure nothing is covering the camera lens and that you are sitting in front of it.',
      }
    }

    return null // all good
  } catch {
    return null // canvas tainted or video not ready — allow through
  }
}

export default function VideoRecorder({ onComplete, maxDurationSeconds = 120, disabled = false }: Props) {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [blobRef, setBlobRef] = useState<Blob | null>(null)
  const [cameraIssue, setCameraIssue] = useState<CameraIssue | null>(null)

  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const playbackRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) setState('unsupported')
  }, [])

  useEffect(() => () => {
    stopStream()
    if (timerRef.current) clearInterval(timerRef.current)
    if (videoUrl) URL.revokeObjectURL(videoUrl)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopStream() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  async function requestAndCheck() {
    setState('requesting')
    setCameraIssue(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true })
      streamRef.current = stream

      const vid = videoPreviewRef.current
      if (vid) {
        vid.srcObject = stream
        await vid.play()
      }

      // Let the camera warm up (auto-exposure settles after ~1.2s)
      setState('checking')
      await new Promise(r => setTimeout(r, 1200))

      const issue = vid ? analyzeFrame(vid) : null
      if (issue) {
        setCameraIssue(issue)
        // Keep stream alive so they can see the preview and fix the issue
        setState('ready') // show preview with error overlay
      } else {
        setState('ready')
      }
    } catch {
      setState('permission_denied')
    }
  }

  async function recheck() {
    setCameraIssue(null)
    setState('checking')
    await new Promise(r => setTimeout(r, 1000))
    const vid = videoPreviewRef.current
    const issue = vid ? analyzeFrame(vid) : null
    if (issue) {
      setCameraIssue(issue)
    }
    setState('ready')
  }

  function startRecording() {
    if (!streamRef.current || cameraIssue) return
    chunksRef.current = []
    setElapsed(0)
    if (videoUrl) { URL.revokeObjectURL(videoUrl); setVideoUrl(null) }
    setBlobRef(null)

    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
      .find(m => MediaRecorder.isTypeSupported(m)) ?? ''

    const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined)
    mediaRecorderRef.current = mr
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
      setBlobRef(blob)
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
      setState('stopped')
    }
    mr.start(250)
    setState('recording')

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= maxDurationSeconds) {
          stopRecording()
          return maxDurationSeconds
        }
        return prev + 1
      })
    }, 1000)
  }

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') mr.stop()
  }, [])

  function reRecord() {
    if (videoUrl) { URL.revokeObjectURL(videoUrl); setVideoUrl(null) }
    setBlobRef(null)
    setElapsed(0)
    setCameraIssue(null)
    setState('checking')
    const vid = videoPreviewRef.current
    if (vid && streamRef.current) {
      vid.srcObject = streamRef.current
      vid.play().then(async () => {
        await new Promise(r => setTimeout(r, 1000))
        const issue = analyzeFrame(vid)
        setCameraIssue(issue)
        setState('ready')
      })
    } else {
      setState('ready')
    }
  }

  function confirm() {
    if (blobRef) onComplete(blobRef)
  }

  const remaining = maxDurationSeconds - elapsed
  const pct = (elapsed / maxDurationSeconds) * 100

  // ── Error states ──────────────────────────────────────────────────
  if (state === 'unsupported') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
        <VideoOff className="mx-auto h-8 w-8 text-red-400 mb-2" />
        <p className="text-sm text-red-600">Your browser does not support camera recording.</p>
      </div>
    )
  }

  if (state === 'permission_denied') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
        <VideoOff className="mx-auto h-8 w-8 text-red-400 mb-2" />
        <p className="text-sm font-semibold text-red-700 mb-1">Camera access denied</p>
        <p className="text-xs text-red-600 mb-3">Please allow camera and microphone access in your browser settings, then reload.</p>
        <button onClick={requestAndCheck} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
          Try again
        </button>
      </div>
    )
  }

  if (state === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="rounded-full bg-indigo-50 p-5">
          <Camera className="h-10 w-10 text-indigo-500" />
        </div>
        <p className="text-sm text-gray-600 text-center">Enable your camera to record your answer</p>
        <button
          onClick={requestAndCheck}
          disabled={disabled}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          <Camera className="h-4 w-4" /> Enable Camera
        </button>
      </div>
    )
  }

  if (state === 'requesting') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-500">Requesting camera access…</p>
      </div>
    )
  }

  if (state === 'checking') {
    return (
      <div className="flex flex-col gap-3">
        {/* Keep video rendering off-screen so we can read its pixels */}
        <video ref={videoPreviewRef} autoPlay muted playsInline className="sr-only" />
        <div className="aspect-video w-full rounded-2xl bg-gray-900 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
          <p className="text-sm text-gray-300">Checking lighting & visibility…</p>
        </div>
      </div>
    )
  }

  // ── Main recorder UI (ready / recording / stopped) ─────────────────
  return (
    <div className="flex flex-col gap-3">
      {/* Camera issue error banner */}
      {cameraIssue && state !== 'recording' && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700">{cameraIssue.title}</p>
              <p className="text-xs text-red-600 mt-0.5">{cameraIssue.message}</p>
              <p className="text-xs text-red-700 font-medium mt-2">Fix: {cameraIssue.tip}</p>
            </div>
          </div>
          <button
            onClick={recheck}
            className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Check again
          </button>
        </div>
      )}

      {/* Camera preview / playback */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-900">
        {/* Live preview */}
        <video
          ref={videoPreviewRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)] ${state === 'stopped' ? 'hidden' : ''}`}
        />
        {/* Recorded playback */}
        {state === 'stopped' && videoUrl && (
          <video
            ref={playbackRef}
            src={videoUrl}
            controls
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {/* REC badge */}
        {state === 'recording' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-semibold text-white">REC</span>
          </div>
        )}
        {/* Countdown timer */}
        {state === 'recording' && (
          <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1">
            <span className={`text-xs font-mono font-bold ${remaining <= 15 ? 'text-red-400' : 'text-white'}`}>
              {fmt(remaining)}
            </span>
          </div>
        )}
        {/* Lighting OK badge */}
        {state === 'ready' && !cameraIssue && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-green-600/80 px-3 py-1">
            <CheckCircle2 className="h-3 w-3 text-white" />
            <span className="text-xs font-semibold text-white">Lighting OK</span>
          </div>
        )}
      </div>

      {/* Progress bar (recording) */}
      {state === 'recording' && (
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-red-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
      )}

      {/* Record / stop button */}
      {(state === 'ready' || state === 'recording') && (
        <div className="flex justify-center">
          <button
            onClick={state === 'ready' ? startRecording : stopRecording}
            disabled={disabled || (state === 'ready' && !!cameraIssue)}
            title={cameraIssue ? 'Fix lighting issues before recording' : undefined}
            className={`flex h-16 w-16 items-center justify-center rounded-full shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              state === 'recording' ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {state === 'recording' ? (
              <span className="h-5 w-5 rounded-sm bg-white" />
            ) : (
              <Video className="h-7 w-7 text-white" />
            )}
          </button>
        </div>
      )}
      {state === 'ready' && !cameraIssue && (
        <p className="text-center text-xs text-gray-500">Tap to start recording</p>
      )}
      {state === 'ready' && cameraIssue && (
        <p className="text-center text-xs text-red-500 font-medium">Fix the lighting issue above before recording</p>
      )}
      {state === 'recording' && (
        <p className="text-center text-xs text-gray-500">Tap to stop recording when done</p>
      )}

      {/* Post-recording actions */}
      {state === 'stopped' && (
        <div className="flex gap-3">
          <button
            onClick={reRecord}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Re-record
          </button>
          <button
            onClick={confirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" /> Submit answer
          </button>
        </div>
      )}
    </div>
  )
}
