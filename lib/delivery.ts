// Measured delivery metrics computed from the transcript + audio duration
// (Deepgram is asked for filler_words=true so disfluencies survive in the text).

const FILLERS = [
  'um', 'uh', 'er', 'ah', 'hmm', 'like', 'basically', 'literally',
  'you know', 'i mean', 'sort of', 'kind of',
]

export interface DeliveryMetrics {
  wordCount: number
  durationSeconds: number | null
  wpm: number | null
  fillerCount: number
  fillerWords: Record<string, number>
}

export function computeDeliveryMetrics(
  transcript: string | null | undefined,
  durationSeconds: number | null | undefined
): DeliveryMetrics {
  const text = (transcript ?? '').trim()
  const lower = text.toLowerCase()
  const words = text ? text.split(/\s+/).filter(Boolean) : []
  const wordCount = words.length
  const dur = typeof durationSeconds === 'number' && durationSeconds > 0 ? durationSeconds : null
  const wpm = dur && wordCount > 0 ? Math.round(wordCount / (dur / 60)) : null

  const fillerWords: Record<string, number> = {}
  let fillerCount = 0
  for (const f of FILLERS) {
    const pattern = new RegExp(`\\b${f.replace(/ /g, '\\s+')}\\b`, 'g')
    const matches = lower.match(pattern)
    if (matches && matches.length) {
      fillerWords[f] = matches.length
      fillerCount += matches.length
    }
  }

  return { wordCount, durationSeconds: dur, wpm, fillerCount, fillerWords }
}

// A comfortable spoken pace is roughly 110–160 wpm.
export function pace(wpm: number | null): 'slow' | 'good' | 'fast' | null {
  if (wpm == null) return null
  if (wpm < 110) return 'slow'
  if (wpm > 160) return 'fast'
  return 'good'
}
