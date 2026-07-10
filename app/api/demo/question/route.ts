import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

// Public, no-auth, no-DB: generates one interview question for the landing-page demo.
export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json()
    const safeRole = typeof role === 'string' && role.trim() ? role.trim().slice(0, 80) : 'a general role'

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Generate ONE opening mock-interview question for a candidate interviewing for ${safeRole}.
It should be answerable in 60-90 seconds and suitable for an entry-to-mid level candidate.
Output ONLY the question text, no preamble, no numbering.`,
      }],
    })
    const question = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    if (!question) return NextResponse.json({ error: 'Could not generate a question.' }, { status: 500 })
    return NextResponse.json({ question })
  } catch (err: unknown) {
    console.error('[demo/question]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
