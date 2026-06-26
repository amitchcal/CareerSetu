import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params
    const supabase = supabaseAdmin

    const { data: session } = await supabase
      .from('sessions')
      .select('role, difficulty')
      .eq('id', sessionId)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })

    const { data: questions } = await supabase
      .from('session_questions')
      .select('question_number, question_text, transcript')
      .eq('session_id', sessionId)
      .order('question_number', { ascending: true })

    if (!questions?.length) return NextResponse.json({ error: 'No questions found.' }, { status: 400 })

    const formatted_qa_pairs = questions
      .map(q => `Q${q.question_number}: ${q.question_text}\nAnswer: ${q.transcript ?? '(no answer recorded)'}`)
      .join('\n\n')

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are an experienced, honest hiring manager evaluating a candidate's mock interview practice session.
Do NOT default to generic praise. Be specific and calibrated — point out real issues even if minor.

Role being interviewed for: ${session.role}
Experience level: ${session.difficulty}

Transcript of all Q&A:
${formatted_qa_pairs}

Evaluate using this rubric:
- Structure: Did answers follow a clear structure (e.g. STAR for behavioral questions)?
- Relevance: Did the answer actually address what was asked?
- Clarity: Was the answer concise and easy to follow, or rambling?
- Filler words / hedging: Note if present (e.g. "um", "like", excessive qualifiers).
- Confidence signals: Based on word choice, did the candidate sound confident or uncertain?

Return ONLY valid JSON in this exact shape, no markdown, no preamble:
{
  "overallScore": <integer 1-10>,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "perQuestionFeedback": [
    {"questionNumber": 1, "feedback": "..."}
  ]
}`,
        },
      ],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    const parsed = JSON.parse(raw)

    await supabase.from('session_feedback').upsert({
      session_id: sessionId,
      overall_score: parsed.overallScore,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      per_question_feedback: parsed.perQuestionFeedback,
    }, { onConflict: 'session_id' })

    return NextResponse.json({
      overallScore: parsed.overallScore,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      perQuestionFeedback: parsed.perQuestionFeedback,
    })
  } catch (err: unknown) {
    console.error('[feedback]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
