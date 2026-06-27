import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

// Public, no-auth, no-DB: quick feedback on a single demo answer for the landing page.
export async function POST(req: NextRequest) {
  try {
    const { role, question, answer } = await req.json()
    const safeRole = typeof role === 'string' ? role.trim().slice(0, 80) : 'a role'
    const safeQuestion = typeof question === 'string' ? question.trim().slice(0, 600) : ''
    const safeAnswer = typeof answer === 'string' ? answer.trim().slice(0, 2000) : ''
    if (!safeQuestion || !safeAnswer) {
      return NextResponse.json({ error: 'Missing question or answer.' }, { status: 400 })
    }

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are an honest, encouraging interview coach. A candidate for ${safeRole} answered a practice question.
Be specific and calibrated — not generic praise. A typical practice answer is a 5-7.

Question: ${safeQuestion}
Answer: ${safeAnswer}

Return ONLY valid JSON, no markdown:
{
  "score": <integer 1-10>,
  "summary": "<one honest sentence>",
  "strength": "<one specific thing done well>",
  "improvement": "<one specific thing to improve>"
}`,
      }],
    })
    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    const parsed = JSON.parse(raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim())
    return NextResponse.json({
      score: parsed.score,
      summary: parsed.summary,
      strength: parsed.strength,
      improvement: parsed.improvement,
    })
  } catch (err: unknown) {
    console.error('[demo/feedback]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
