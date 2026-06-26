'use client'

import { useState } from 'react'
import VoiceRecorder from '@/components/shared/VoiceRecorder'

export default function TestRecorderPage() {
  const [result, setResult] = useState<{ size: number; type: string } | null>(null)

  function handleComplete(blob: Blob) {
    console.log('Recording complete:', blob)
    setResult({ size: blob.size, type: blob.type })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
          VoiceRecorder Test
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Test the recorder in isolation. Check the browser console for blob output.
        </p>

        <VoiceRecorder
          onComplete={handleComplete}
          maxDuration={30}
        />

        {result && (
          <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
            <p className="font-semibold text-green-800 mb-1">onComplete fired!</p>
            <p className="text-green-700">Type: <code className="font-mono">{result.type}</code></p>
            <p className="text-green-700">Size: <code className="font-mono">{(result.size / 1024).toFixed(1)} KB</code></p>
          </div>
        )}

        <div className="mt-6 rounded-lg bg-gray-100 p-3 text-xs text-gray-500">
          <p className="font-semibold mb-1">Things to test:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Tap mic → recording starts with pulse + timer</li>
            <li>Tap stop → playback appears</li>
            <li>Play button → audio plays back</li>
            <li>Re-record → resets cleanly</li>
            <li>Confirm → green box appears above</li>
            <li>Deny mic permission → error message + retry</li>
            <li>Let it run 30s → auto-stops with warning</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
