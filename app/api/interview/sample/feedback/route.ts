import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { anthropic } from '@/lib/anthropic'

// Service-role client for storage uploads (bypasses RLS)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

async function transcribeWithDeepgram(audioBuffer: ArrayBuffer, mimeType: string): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) throw new Error('DEEPGRAM_API_KEY is not configured.')

  const res = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=en-IN&smart_format=true', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': mimeType,
    },
    body: audioBuffer,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Deepgram error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const transcript: string =
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''

  return transcript
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio') as File | null
    const question = (formData.get('question') as string | null) ?? ''
    const targetRole = (formData.get('targetRole') as string | null) ?? 'a general role'

    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 })
    }

    const arrayBuffer = await audio.arrayBuffer()
    const mimeType = audio.type || 'audio/webm'

    // 1. Upload to Supabase storage (temp bucket)
    const supabase = getServiceClient()
    const fileName = `sample/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`

    const { error: uploadErr } = await supabase.storage
      .from('interview-audio')
      .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: false })

    // Non-fatal: we still have the buffer for STT even if upload fails
    if (uploadErr) {
      console.warn('[sample feedback] Storage upload failed (non-fatal):', uploadErr.message)
    }

    // 2. Transcribe
    const transcript = await transcribeWithDeepgram(arrayBuffer, mimeType)

    if (!transcript.trim()) {
      return NextResponse.json(
        { error: 'Could not transcribe your answer. Please try again or skip.' },
        { status: 422 }
      )
    }

    // 3. Generate short feedback via Claude
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `You are a helpful interview coach. A candidate applying for "${targetRole}" just answered this question:

Question: ${question}

Their answer (transcribed): ${transcript}

Give ONE or TWO sentences of honest, specific, encouraging feedback — highlight one thing done well and one thing to improve. Be direct and concrete, not generic. Output only the feedback text, no preamble.`,
        },
      ],
    })

    const feedback =
      message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    return NextResponse.json({ transcript, feedback })
  } catch (err: unknown) {
    console.error('[sample feedback]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
