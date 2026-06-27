import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

interface SubmitBody {
  // map of mcq_test_questions.id -> selected option index
  answers: Record<string, number>
  timeSpent?: Record<string, number>
}

export async function POST(req: NextRequest, { params }: { params: { testId: string } }) {
  try {
    const auth = createSupabaseServerClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const { testId } = params
    const { answers, timeSpent } = (await req.json()) as SubmitBody

    // Ownership check + already-submitted guard
    const { data: test } = await supabaseAdmin
      .from('mcq_tests')
      .select('id, user_id, status')
      .eq('id', testId)
      .single()
    if (!test || test.user_id !== user.id) {
      return NextResponse.json({ error: 'Test not found.' }, { status: 404 })
    }

    // Fetch the test questions with correct answers
    const { data: tqs } = await supabaseAdmin
      .from('mcq_test_questions')
      .select('id, question_id, questions(correct_option)')
      .eq('test_id', testId)

    let score = 0
    for (const tq of tqs ?? []) {
      const correct = (tq.questions as unknown as { correct_option: number | null })?.correct_option
      const userAnswer = answers?.[tq.id]
      const hasAnswer = typeof userAnswer === 'number'
      const isCorrect = hasAnswer && userAnswer === correct
      if (isCorrect) score++
      await supabaseAdmin
        .from('mcq_test_questions')
        .update({
          user_answer: hasAnswer ? userAnswer : null,
          is_correct: hasAnswer ? isCorrect : null,
          time_spent_seconds: timeSpent?.[tq.id] ?? null,
        })
        .eq('id', tq.id)
    }

    await supabaseAdmin
      .from('mcq_tests')
      .update({ status: 'submitted', score, submitted_at: new Date().toISOString() })
      .eq('id', testId)

    return NextResponse.json({ score, total: (tqs ?? []).length })
  } catch (err: unknown) {
    console.error('[test/submit]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
