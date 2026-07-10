import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { anthropic } from '@/lib/anthropic'
import { getAdminUser } from '@/lib/admin'

const MAX_COUNT = 15

interface GenBody {
  trackId: string
  companyId?: string | null
  roundType: string // 'technical' | 'hr' | 'managerial' | 'aptitude' | 'domain'
  difficulty: string // 'fresher' | 'intermediate' | 'experienced'
  format: string // 'interview' | 'mcq'
  count: number
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

    const body = (await req.json()) as GenBody
    const { trackId, companyId, roundType, difficulty, format } = body
    const count = Math.min(Math.max(Number(body.count) || 5, 1), MAX_COUNT)

    if (!trackId || !roundType || !difficulty || !format) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // Resolve track + optional company for prompt grounding
    const { data: track } = await supabaseAdmin
      .from('tracks')
      .select('name, category')
      .eq('id', trackId)
      .single()
    if (!track) return NextResponse.json({ error: 'Track not found.' }, { status: 404 })

    let companyName: string | null = null
    let companyNotes: string | null = null
    if (companyId) {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('name, interview_style_notes')
        .eq('id', companyId)
        .single()
      companyName = company?.name ?? null
      companyNotes = company?.interview_style_notes ?? null
    }

    const companyClause = companyName
      ? `Calibrate to the PUBLICLY DOCUMENTED interview pattern of ${companyName} (${companyNotes ?? 'standard pattern'}). Match its typical topic mix and difficulty. Do NOT reproduce any real, leaked, or copyrighted questions — write ORIGINAL questions in that style.`
      : `Keep the questions company-neutral.`

    const shape =
      format === 'mcq'
        ? `Each item must have EXACTLY 4 options with exactly one correct answer and a one-line explanation of why it is correct.
Return ONLY a valid JSON array (no markdown, no preamble) of this shape:
[{"question_text":"...","options":["a","b","c","d"],"correct_option":0,"explanation":"...","tags":["topic"]}]`
        : `Each item is an open verbal interview question. In "explanation", give 2-4 concise ideal-answer key points an evaluator would look for.
Return ONLY a valid JSON array (no markdown, no preamble) of this shape:
[{"question_text":"...","explanation":"key points...","tags":["topic"]}]`

    const prompt = `You are creating original practice questions for CareerSetu, an interview-prep app for Indian job seekers.

Generate ${count} ${format === 'mcq' ? 'multiple-choice' : 'interview'} questions for:
- Skill track: ${track.name} (${track.category})
- Round type: ${roundType}
- Difficulty: ${difficulty}
- ${companyClause}

Requirements:
- Accurate, unambiguous, and genuinely useful for interview preparation.
- Appropriate for the stated difficulty.
- No duplicates within this set.
- "tags" should hold 1-3 short topic labels.

${shape}`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
    const jsonText = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()

    let items: unknown
    try {
      items = JSON.parse(jsonText)
    } catch {
      return NextResponse.json({ error: 'Model returned invalid JSON.', raw }, { status: 502 })
    }
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Expected a JSON array.' }, { status: 502 })
    }

    const sourceNote = companyName
      ? `Modelled on ${companyName} ${roundType} pattern`
      : `Generic ${track.name} · ${roundType}`

    const rows = items
      .map((it) => {
        const item = it as Record<string, unknown>
        if (typeof item.question_text !== 'string' || !item.question_text.trim()) return null
        const isMcq = format === 'mcq'
        if (isMcq) {
          const options = Array.isArray(item.options) ? (item.options as unknown[]).map(String) : []
          if (options.length !== 4) return null
          const correct = Number(item.correct_option)
          if (!Number.isInteger(correct) || correct < 0 || correct > 3) return null
          return {
            track_id: trackId,
            company_id: companyId ?? null,
            format,
            round_type: roundType,
            difficulty,
            question_text: String(item.question_text).trim(),
            options,
            correct_option: correct,
            explanation: typeof item.explanation === 'string' ? item.explanation : null,
            tags: Array.isArray(item.tags) ? (item.tags as unknown[]).map(String) : [],
            source_note: sourceNote,
            status: 'draft',
          }
        }
        return {
          track_id: trackId,
          company_id: companyId ?? null,
          format,
          round_type: roundType,
          difficulty,
          question_text: String(item.question_text).trim(),
          options: null,
          correct_option: null,
          explanation: typeof item.explanation === 'string' ? item.explanation : null,
          tags: Array.isArray(item.tags) ? (item.tags as unknown[]).map(String) : [],
          source_note: sourceNote,
          status: 'draft',
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    if (!rows.length) {
      return NextResponse.json({ error: 'No valid questions parsed.', raw }, { status: 502 })
    }

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('questions')
      .insert(rows)
      .select('id')

    if (insErr) {
      console.error('[admin/questions/generate] insert:', insErr)
      return NextResponse.json({ error: 'Could not save generated questions.' }, { status: 500 })
    }

    return NextResponse.json({ generated: inserted?.length ?? 0 })
  } catch (err: unknown) {
    console.error('[admin/questions/generate]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
