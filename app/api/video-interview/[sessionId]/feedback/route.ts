import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { anthropic } from '@/lib/anthropic'
import { pickCompetencies, COMPETENCY_LABELS } from '@/lib/competencies'

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params
    const supabase = supabaseAdmin

    const { data: session } = await supabase
      .from('sessions')
      .select('role, difficulty, seniority, round_type, tracks(category)')
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

    const category = (session.tracks as unknown as { category: string | null } | null)?.category ?? null
    const seniority = session.seniority ?? session.difficulty
    const competencyKeys = pickCompetencies({ category, roundType: session.round_type, seniority })
    const competencyList = competencyKeys.map(k => `- "${k}": ${COMPETENCY_LABELS[k] ?? k}`).join('\n')

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1800,
      messages: [{
        role: 'user',
        content: `You are an experienced, honest hiring manager evaluating a candidate's mock video interview practice session.
Do NOT default to generic praise. Be specific and calibrated — point out real issues even if minor. A typical practice answer is a 5–7, not a 9.

Role being interviewed for: ${session.role}
Seniority: ${seniority}
${session.round_type ? `Round type: ${session.round_type}` : ''}

Transcript of all Q&A:
${formatted_qa_pairs}

Score the candidate on EXACTLY these competencies (integer 0-10 each, calibrated and honest):
${competencyList}

Also give an overall score (1-10), what went well, what to improve, and concise per-question feedback.

Return ONLY valid JSON in this exact shape, no markdown, no preamble:
{
  "overallScore": <integer 1-10>,
  "competencyScores": { ${competencyKeys.map(k => `"${k}": <0-10>`).join(', ')} },
  "whatWentWell": ["...", "..."],
  "whatToImprove": ["...", "..."],
  "perQuestionFeedback": [
    {"questionNumber": 1, "feedback": "..."}
  ]
}`,
      }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    const jsonText = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    const parsed = JSON.parse(jsonText)

    const competencyScores: Record<string, number> = {}
    for (const k of competencyKeys) {
      const v = Number(parsed.competencyScores?.[k])
      if (Number.isFinite(v)) competencyScores[k] = Math.max(0, Math.min(10, Math.round(v)))
    }

    await supabase.from('session_feedback').upsert({
      session_id: sessionId,
      overall_score: parsed.overallScore,
      strengths: parsed.whatWentWell,
      weaknesses: parsed.whatToImprove,
      per_question_feedback: parsed.perQuestionFeedback,
      competency_scores: competencyScores,
    }, { onConflict: 'session_id' })

    return NextResponse.json({
      overallScore: parsed.overallScore,
      competencyScores,
      strengths: parsed.whatWentWell,
      weaknesses: parsed.whatToImprove,
      perQuestionFeedback: parsed.perQuestionFeedback,
    })
  } catch (err: unknown) {
    console.error('[video-interview/feedback]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
