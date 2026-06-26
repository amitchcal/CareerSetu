import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { targetRole } = await req.json()

    const role = (targetRole as string | undefined)?.trim() || 'a general role'

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `You are an experienced interviewer. Generate exactly ONE interview question for a candidate applying for: ${role}.

Requirements:
- The question should be practical and relevant to the role
- It should be answerable in 60-90 seconds verbally
- Do NOT include any preamble, numbering, or explanation — output ONLY the question text itself`,
        },
      ],
    })

    const question =
      message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    if (!question) {
      return NextResponse.json({ error: 'Failed to generate question' }, { status: 500 })
    }

    return NextResponse.json({ question })
  } catch (err: unknown) {
    console.error('[sample question]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
