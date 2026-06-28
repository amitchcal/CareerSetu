import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { userId, jobResultId, cvText } = await req.json() as {
      userId: string
      jobResultId: string
      cvText: string
    }

    if (!userId || !jobResultId || !cvText) {
      return NextResponse.json({ error: 'userId, jobResultId and cvText are required.' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    // Return cached tailoring if it exists
    const { data: existing } = await supabase
      .from('tailored_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('job_result_id', jobResultId)
      .maybeSingle()

    if (existing) return NextResponse.json(existing)

    const { data: job } = await supabase
      .from('job_results')
      .select('title, company, description, missing_skills')
      .eq('id', jobResultId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are an expert resume coach for Indian job seekers. Tailor this candidate's profile for the specific job below.

Job Title: ${job.title}
Company: ${job.company}
Job Description:
${(job.description ?? '').slice(0, 2000)}

Missing skills identified: ${(job.missing_skills as string[] ?? []).join(', ')}

Candidate's current CV:
${cvText.slice(0, 4000)}

Return ONLY valid JSON, no markdown:
{
  "tailoredSummary": "<3-line professional summary, ATS-optimised, written in first person, uses keywords from JD>",
  "tailoredBullets": ["<impact bullet 1 using numbers where possible>", "<bullet 2>", "<bullet 3>", "<bullet 4>", "<bullet 5>"],
  "keywordsAdded": ["<keyword from JD now incorporated>", ...],
  "upskillingSuggestions": ["<specific course or skill to learn for this role>", ...]
}`,
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const result = JSON.parse(raw)

    const { data: saved } = await supabase
      .from('tailored_profiles')
      .insert({
        user_id: userId,
        job_result_id: jobResultId,
        original_cv_text: cvText.slice(0, 8000),
        tailored_summary: result.tailoredSummary,
        tailored_bullets: result.tailoredBullets,
        keywords_added: result.keywordsAdded,
        upskilling_suggestions: result.upskillingSuggestions,
      })
      .select('*')
      .single()

    return NextResponse.json(saved)
  } catch (err: unknown) {
    console.error('[jobs/tailor]', err)
    const msg = err instanceof Error ? err.message : 'Tailoring failed.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
