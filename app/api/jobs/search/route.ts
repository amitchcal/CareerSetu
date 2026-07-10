import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createSupabaseServerClient } from '@/lib/supabase-server'

interface JSearchJob {
  job_id: string
  job_title: string
  employer_name: string
  job_city: string | null
  job_country: string | null
  job_description: string
  job_apply_link: string
  job_employment_type: string | null
  job_publisher: string | null
}

interface ScoredJob {
  external_job_id: string
  title: string
  company: string
  location: string | null
  description: string
  apply_url: string
  source: string | null
  match_score: number
  matched_skills: string[]
  missing_skills: string[]
}

async function scoreJobsBatch(
  jobs: JSearchJob[],
  skills: string[]
): Promise<ScoredJob[]> {
  if (jobs.length === 0) return []

  const jobsBlock = jobs
    .map((j, i) => `JOB ${i + 1} [${j.job_id}]:
Title: ${j.job_title}
Company: ${j.employer_name}
Description: ${j.job_description.slice(0, 800)}`)
    .join('\n\n---\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Candidate skills: ${skills.join(', ')}

Score each job below for skill match. Return ONLY valid JSON array, no markdown.

${jobsBlock}

Return this exact JSON array (one entry per job, in order):
[
  {
    "jobIndex": 1,
    "matchScore": <0-100>,
    "matchedSkills": ["skill1", ...],
    "missingSkills": ["skill1", ...]
  },
  ...
]`,
    }],
  })

  const raw = message.content[0]?.type === 'text' ? message.content[0].text : '[]'
  const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const scores: Array<{ jobIndex: number; matchScore: number; matchedSkills: string[]; missingSkills: string[] }> = JSON.parse(jsonText || '[]')

  return jobs.map((j, i) => {
    const s = scores.find(x => x.jobIndex === i + 1) ?? { matchScore: 0, matchedSkills: [], missingSkills: [] }
    const loc = [j.job_city, j.job_country].filter(Boolean).join(', ') || null
    return {
      external_job_id: j.job_id,
      title: j.job_title,
      company: j.employer_name,
      location: loc,
      description: j.job_description.slice(0, 2000),
      apply_url: j.job_apply_link,
      source: j.job_publisher ?? null,
      match_score: s.matchScore,
      matched_skills: s.matchedSkills,
      missing_skills: s.missingSkills,
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const { userId, query, location, extractedSkills } = await req.json() as {
      userId: string
      query: string
      location?: string
      extractedSkills: string[]
    }

    if (!userId || !query || !extractedSkills?.length) {
      return NextResponse.json({ error: 'userId, query and extractedSkills are required.' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    // Check for cached results from the last 24h
    const { data: cachedSearch } = await supabase
      .from('job_searches')
      .select('id')
      .eq('user_id', userId)
      .eq('query', query)
      .eq('location', location ?? null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle()

    if (cachedSearch) {
      const { data: cachedJobs } = await supabase
        .from('job_results')
        .select('*')
        .eq('search_id', cachedSearch.id)
        .order('match_score', { ascending: false })
        .limit(20)

      if (cachedJobs && cachedJobs.length > 0) {
        return NextResponse.json({ searchId: cachedSearch.id, jobs: cachedJobs })
      }
    }

    // Fetch from JSearch API
    const rapidApiKey = process.env.RAPIDAPI_KEY
    if (!rapidApiKey) {
      return NextResponse.json({ error: 'Job search API not configured.' }, { status: 500 })
    }

    const searchQuery = location ? `${query} in ${location}` : `${query} in India`
    const apiUrl = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&country=in&page=1&num_pages=2`

    const apiRes = await fetch(apiUrl, {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    })

    if (!apiRes.ok) {
      return NextResponse.json({ error: 'Job search API request failed.' }, { status: 502 })
    }

    const apiData = await apiRes.json() as { data?: JSearchJob[] }
    const rawJobs: JSearchJob[] = apiData.data ?? []

    if (rawJobs.length === 0) {
      return NextResponse.json({ searchId: null, jobs: [] })
    }

    // Score in batches of 5
    const batches: JSearchJob[][] = []
    for (let i = 0; i < rawJobs.length; i += 5) {
      batches.push(rawJobs.slice(i, i + 5))
    }
    const scoredBatches = await Promise.all(batches.map(b => scoreJobsBatch(b, extractedSkills)))
    const scoredJobs = scoredBatches.flat().sort((a, b) => b.match_score - a.match_score).slice(0, 20)

    // Save search + results
    const { data: newSearch, error: searchErr } = await supabase
      .from('job_searches')
      .insert({ user_id: userId, query, location: location ?? null, extracted_skills: extractedSkills })
      .select('id')
      .single()

    if (searchErr || !newSearch) {
      return NextResponse.json({ error: 'Failed to save search.' }, { status: 500 })
    }

    const jobRows = scoredJobs.map(j => ({ search_id: newSearch.id, ...j }))
    await supabase.from('job_results').insert(jobRows)

    const { data: savedJobs } = await supabase
      .from('job_results')
      .select('*')
      .eq('search_id', newSearch.id)
      .order('match_score', { ascending: false })

    return NextResponse.json({ searchId: newSearch.id, jobs: savedJobs ?? [] })
  } catch (err: unknown) {
    console.error('[jobs/search]', err)
    const msg = err instanceof Error ? err.message : 'Search failed.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
