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
  return buffer.toString('utf-8')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const cvFile = formData.get('cv') as File | null

    if (!cvFile) {
      return NextResponse.json({ error: 'CV file is required.' }, { status: 400 })
    }

    const cvText = await extractText(cvFile)
    if (!cvText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from CV.' }, { status: 422 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Extract structured information from this CV/resume. Return ONLY valid JSON, no markdown.

CV TEXT:
${cvText.slice(0, 6000)}

Return this exact JSON shape:
{
  "name": "<candidate name or null>",
  "currentRole": "<most recent job title or null>",
  "experienceYears": <integer years of total experience, 0 if fresher>,
  "skills": ["<skill1>", "<skill2>", ...],
  "cvText": "<full raw cv text for storage>"
}`,
      }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(raw)
    parsed.cvText = cvText.slice(0, 8000)

    return NextResponse.json(parsed)
  } catch (err: unknown) {
    console.error('[cv/parse]', err)
    const msg = err instanceof Error ? err.message : 'Parse failed.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
