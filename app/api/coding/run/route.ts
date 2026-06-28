import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { runCode, CODE_LANGUAGES } from '@/lib/coderunner'

interface RunBody {
  questionId: string
  language: string
  sourceCode: string
}

interface TestCase { stdin?: string; expected?: string }

export async function POST(req: NextRequest) {
  try {
    const auth = createSupabaseServerClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

    const { questionId, language, sourceCode } = (await req.json()) as RunBody
    if (!questionId || !language || !sourceCode?.trim()) {
      return NextResponse.json({ error: 'Missing question, language or code.' }, { status: 400 })
    }
    if (!CODE_LANGUAGES[language]) {
      return NextResponse.json({ error: 'Unsupported language.' }, { status: 400 })
    }

    const { data: question } = await supabaseAdmin
      .from('questions')
      .select('test_cases')
      .eq('id', questionId)
      .single()
    if (!question) return NextResponse.json({ error: 'Question not found.' }, { status: 404 })

    const tests = (question.test_cases as TestCase[] | null) ?? []
    if (!tests.length) return NextResponse.json({ error: 'This problem has no test cases.' }, { status: 400 })

    const results: { index: number; passed: boolean; stdout: string; expected: string; stderr: string }[] = []
    let passed = 0
    for (let i = 0; i < tests.length; i++) {
      const t = tests[i]
      const expected = (t.expected ?? '').trim()
      let stdout = ''
      let stderr = ''
      try {
        const r = await runCode(language, sourceCode, t.stdin ?? '')
        stdout = (r.stdout ?? '').trim()
        stderr = (r.stderr ?? '').trim()
        if (r.timedOut) stderr = stderr || 'Time limit exceeded'
      } catch (e) {
        stderr = e instanceof Error ? e.message : 'Execution failed'
      }
      const ok = stderr === '' && stdout === expected
      if (ok) passed++
      results.push({ index: i + 1, passed: ok, stdout, expected, stderr })
    }

    await supabaseAdmin.from('coding_attempts').insert({
      user_id: user.id,
      question_id: questionId,
      language,
      source_code: sourceCode,
      passed,
      total: tests.length,
      results,
    })

    return NextResponse.json({ passed, total: tests.length, results })
  } catch (err: unknown) {
    console.error('[coding/run]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
