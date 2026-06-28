import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// POST /api/resume/[id]/improve
// body: { section, content, targetRole? }
// Returns AI-improved version of the section content
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: NextRequest, _ctx: { params: { id: string } }) {
  const { section, content, targetRole = 'professional' } = await req.json()

  const prompts: Record<string, string> = {
    summary: `You are an expert resume writer. Improve this professional summary for a ${targetRole} role.
Make it 3-4 sentences: hook about the candidate's value, years of experience, key skills, and what they bring.
Be specific and confident. No clichés like "results-driven" or "team player".
Original: """${content}"""
Return ONLY the improved summary text, nothing else.`,

    work_bullets: `You are an expert resume writer. Improve these work experience bullet points for a ${targetRole} role.
Use the XYZ formula: Accomplished [X] by doing [Y] resulting in [Z].
Add quantifiable impact where possible (%, numbers, scale). Start each bullet with a strong action verb.
Original bullets:
${Array.isArray(content) ? content.map((b: string) => `- ${b}`).join('\n') : content}
Return ONLY a JSON array of improved bullet strings, no markdown, no preamble.`,

    skills: `You are an expert resume writer. Review these skills for a ${targetRole} role.
Suggest any important missing skills and reorder for impact. Keep existing valid skills.
Current skills: ${JSON.stringify(content)}
Return ONLY valid JSON: {"technical": [...], "soft": [...]}`,
  }

  const prompt = prompts[section]
  if (!prompt) return NextResponse.json({ error: 'Invalid section' }, { status: 400 })

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (msg.content[0] as { type: string; text: string }).text.trim()

    if (section === 'summary') return NextResponse.json({ improved: text })

    // For JSON sections, parse and return
    try {
      const parsed = JSON.parse(text)
      return NextResponse.json({ improved: parsed })
    } catch {
      return NextResponse.json({ improved: text })
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
