import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// POST /api/resume/session-insights/[sessionId]
// Generates resume bullet points from a completed interview session
export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userId: _userId } = await req.json()

  // Fetch session + questions + feedback
  const [{ data: session }, { data: questions }] = await Promise.all([
    supabaseAdmin.from('sessions').select('role, difficulty, status').eq('id', params.sessionId).single(),
    supabaseAdmin
      .from('session_questions')
      .select('question_number, question_text, transcript')
      .eq('session_id', params.sessionId)
      .not('transcript', 'is', null)
      .order('question_number'),
  ])

  if (!session || session.status !== 'completed') {
    return NextResponse.json({ error: 'Session not found or not completed' }, { status: 404 })
  }

  const qaPairs = (questions ?? [])
    .map((q) => `Q${q.question_number}: ${q.question_text}\nA: ${q.transcript}`)
    .join('\n\n')

  const prompt = `You are an expert resume writer reviewing a mock interview transcript for a ${session.role} role.

Based on the candidate's answers, extract 3-5 strong resume bullet points that highlight their real achievements, skills, or experiences they mentioned.

Use the XYZ formula: Accomplished [X] by doing [Y] resulting in [Z].
- Start each bullet with a strong past-tense action verb
- Include specific numbers/impact wherever the candidate mentioned them
- Focus only on genuine things mentioned in the transcript, not invented achievements

Interview transcript:
${qaPairs}

Return ONLY a valid JSON array of bullet point strings. No markdown, no explanation.
Example: ["Led migration of legacy system to microservices, reducing deployment time by 60%", ...]`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (msg.content[0] as { type: string; text: string }).text.trim()
    const bullets = JSON.parse(text)
    return NextResponse.json({ bullets, role: session.role })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
