import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

const SECONDS_PER_QUESTION = 60

interface StartBody {
  trackId: string
  companyId?: string | null
  roundType?: string | null
  difficulty: string
  length: number
}

export async function POST(req: NextRequest) {
  try {
    const auth = createSupabaseServerClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const body = (await req.json()) as StartBody
    const { trackId, companyId, roundType, difficulty } = body
    const length = Math.min(Math.max(Number(body.length) || 10, 1), 50)
    if (!trackId || !difficulty) {
      return NextResponse.json({ error: 'Missing track or difficulty.' }, { status: 400 })
    }

    // Pull matching approved MCQs
    let q = supabaseAdmin
      .from('questions')
      .select('id')
      .eq('status', 'approved')
      .eq('format', 'mcq')
      .eq('track_id', trackId)
      .eq('difficulty', difficulty)
    if (companyId) q = q.eq('company_id', companyId)
    if (roundType) q = q.eq('round_type', roundType)

    const { data: pool, error: poolErr } = await q
    if (poolErr) throw poolErr
    if (!pool || pool.length === 0) {
      return NextResponse.json({ error: 'No approved questions match this selection yet.' }, { status: 404 })
    }

    // Shuffle and take up to `length`
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, Math.min(length, shuffled.length))
    const count = picked.length
    const durationSeconds = count * SECONDS_PER_QUESTION

    // Create the test
    const { data: test, error: testErr } = await supabaseAdmin
      .from('mcq_tests')
      .insert({
        user_id: user.id,
        track_id: trackId,
        company_id: companyId ?? null,
        num_questions: count,
        duration_seconds: durationSeconds,
        status: 'in_progress',
      })
      .select('id, started_at, duration_seconds')
      .single()
    if (testErr || !test) throw testErr ?? new Error('Could not create test.')

    // Create the test questions (preserving order)
    const rows = picked.map((p, i) => ({ test_id: test.id, question_id: p.id, position: i + 1 }))
    const { error: tqErr } = await supabaseAdmin.from('mcq_test_questions').insert(rows)
    if (tqErr) throw tqErr

    // Return question content WITHOUT correct answers
    const { data: tqs } = await supabaseAdmin
      .from('mcq_test_questions')
      .select('id, position, questions(id, question_text, options)')
      .eq('test_id', test.id)
      .order('position', { ascending: true })

    const questions = (tqs ?? []).map((tq) => {
      const question = tq.questions as unknown as { id: string; question_text: string; options: string[] }
      return {
        testQuestionId: tq.id,
        position: tq.position,
        questionText: question.question_text,
        options: question.options,
      }
    })

    return NextResponse.json({
      testId: test.id,
      startedAt: test.started_at,
      durationSeconds: test.duration_seconds,
      questions,
    })
  } catch (err: unknown) {
    console.error('[test/start]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
