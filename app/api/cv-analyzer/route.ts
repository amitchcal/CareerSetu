import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
  const data = await pdfParse(buffer)
  return data.text
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const name = file.name.toLowerCase()

  if (name.endsWith('.pdf')) return extractTextFromPDF(buffer)
  if (name.endsWith('.docx') || name.endsWith('.doc')) return extractTextFromDOCX(buffer)
  // Plain text fallback
  return buffer.toString('utf-8')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const jdFile = formData.get('jd') as File | null
    const cvFile = formData.get('cv') as File | null

    if (!jdFile || !cvFile) {
      return NextResponse.json({ error: 'Both JD and CV files are required.' }, { status: 400 })
    }

    const [jdText, cvText] = await Promise.all([
      extractText(jdFile),
      extractText(cvFile),
    ])

    if (!jdText.trim() || !cvText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from one or both files.' }, { status: 422 })
    }

    const prompt = `You are an expert career consultant and ATS optimization specialist.

Analyze the following Job Description (JD) and Candidate CV. Then:
1. Identify gap areas where the CV does not match the JD requirements
2. Extract important keywords from the JD that are missing from the CV
3. Provide a rewritten CV that incorporates the missing keywords and better matches the JD

JOB DESCRIPTION:
${jdText.slice(0, 4000)}

CANDIDATE CV:
${cvText.slice(0, 4000)}

Return ONLY valid JSON in this exact shape, no markdown, no preamble:
{
  "matchScore": <integer 0-100 representing how well the CV currently matches the JD>,
  "gapAreas": [
    {
      "category": "<e.g. Technical Skills | Experience | Certifications | Keywords | Soft Skills>",
      "description": "<specific gap description>",
      "severity": "high | medium | low"
    }
  ],
  "missingKeywords": ["<keyword1>", "<keyword2>", ...],
  "presentKeywords": ["<keyword1>", "<keyword2>", ...],
  "rewrittenCV": "<full rewritten CV text with proper formatting using \\n for line breaks, incorporating missing keywords naturally>",
  "improvementTips": ["<actionable tip 1>", "<actionable tip 2>", ...]
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const result = JSON.parse(jsonText)

    return NextResponse.json(result)
  } catch (err: unknown) {
    console.error('[cv-analyzer]', err)
    const message = err instanceof Error ? err.message : 'Analysis failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
