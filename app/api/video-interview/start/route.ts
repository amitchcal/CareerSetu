import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { anthropic } from '@/lib/anthropic'
import { buildInterviewContext, isSenior } from '@/lib/interview-prompt'

function toDifficulty(seniority: string): string {
  return seniority === 'lead' ? 'experienced' : seniority
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId, trackId, companyId, roundType, seniority,
      language, numQuestions, jobTitle, jobDescription, resumeText,
    } = body

    if (!userId || !trackId || !seniority || !language || !numQuestions) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    if (isSenior(seniority) && !jobDescription?.trim()) {
      return NextResponse.json({ error: 'A job description is required for experienced / lead interviews.' }, { status: 400 })
    }

    const supabase = supabaseAdmin

    const { data: track } = await supabase.from('tracks').select('name, category').eq('id', trackId).single()
    if (!track) return NextResponse.json({ error: 'Track not found.' }, { status: 404 })

    let companyName: string | null = null
    let companyNotes: string | null = null
    if (companyId) {
      const { data: company } = await supabase.from('companies').select('name, interview_style_notes').eq('id', companyId).single()
      companyName = company?.name ?? null
      companyNotes = company?.interview_style_notes ?? null
    }

    const difficulty = toDifficulty(seniority)
    const role = (jobTitle?.trim() || track.name) as string
    const resumeSnapshot = isSenior(seniority) && typeof resumeText === 'string' && resumeText.trim()
      ? resumeText.trim() : null

    const context = buildInterviewContext({
      trackName: track.name, category: track.category, companyName, companyNotes,
      roundType, seniority, jobTitle, jobDescription, resumeText: resumeSnapshot,
    })

    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .insert({
        user_id: userId, role, difficulty, language, num_questions: numQuestions, status: 'in_progress',
        track_id: trackId, company_id: companyId ?? null, round_type: roundType ?? null,
        seniority, job_title: jobTitle?.trim() || null, job_description: jobDescription?.trim() || null,
        resume_snapshot: resumeSnapshot,
        session_type: 'video',
      })
      .select('id')
      .single()

    if (sessionErr || !session) {
      console.error('[video-interview/start] session insert:', sessionErr)
      return NextResponse.json({ error: 'Could not create session.', detail: sessionErr?.message }, { status: 500 })
    }
    const sessionId = session.id

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are an experienced interviewer conducting a mock video interview.
${context}
Language: ${language}

Generate ONE opening interview question — a natural conversational opener appropriate to the round type and seniority above.

Requirements:
- Appropriate for the seniority
- Answerable verbally in 60–90 seconds
- Output ONLY the question text, no preamble, no numbering`,
      }],
    })

    const firstQuestion = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    if (!firstQuestion) return NextResponse.json({ error: 'Failed to generate first question.' }, { status: 500 })

    await supabase.from('session_questions').insert({
      session_id: sessionId, question_number: 1, question_text: firstQuestion,
    })

    return NextResponse.json({ sessionId, firstQuestion })
  } catch (err: unknown) {
    console.error('[video-interview/start]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
