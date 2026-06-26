import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { userId, role, difficulty, language, numQuestions } = await req.json()

    if (!userId || !role || !difficulty || !language || !numQuestions) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const supabase = supabaseAdmin

    // Create session row
    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .insert({ user_id: userId, role, difficulty, language, num_questions: numQuestions, status: 'in_progress' })
      .select('id')
      .single()

    if (sessionErr || !session) {
      console.error('[interview/start] session insert:', sessionErr)
      return NextResponse.json({ error: 'Could not create session.', detail: sessionErr?.message, code: sessionErr?.code }, { status: 500 })
    }

    const sessionId = session.id

    // Generate first question via Claude
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are an experienced interviewer conducting a mock interview.
Role being interviewed for: ${role}
Experience level: ${difficulty}
Language: ${language}

Generate ONE opening interview question. It should be a natural, conversational opener (e.g. "Tell me about yourself" style or a relevant background question).

Requirements:
- Appropriate for the experience level
- Answerable verbally in 60–90 seconds
- Output ONLY the question text, no preamble, no numbering`,
        },
      ],
    })

    const firstQuestion = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    if (!firstQuestion) {
      return NextResponse.json({ error: 'Failed to generate first question.' }, { status: 500 })
    }

    // Store question 1
    const { error: qErr } = await supabase.from('session_questions').insert({
      session_id: sessionId,
      question_number: 1,
      question_text: firstQuestion,
    })

    if (qErr) {
      console.error('[interview/start] question insert:', qErr)
      // Non-fatal — session exists, we return sessionId and question anyway
    }

    return NextResponse.json({ sessionId, firstQuestion })
  } catch (err: unknown) {
    console.error('[interview/start]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
