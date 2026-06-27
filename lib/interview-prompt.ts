// Shared grounding context for interview question generation (start + answer routes).

export interface InterviewContext {
  trackName: string
  category?: string | null
  companyName?: string | null
  companyNotes?: string | null
  roundType?: string | null // 'technical' | 'hr' | 'managerial' | 'domain'
  seniority?: string | null // 'fresher' | 'intermediate' | 'experienced' | 'lead'
  jobTitle?: string | null
  jobDescription?: string | null
  resumeText?: string | null
}

const ROUND_FOCUS: Record<string, string> = {
  technical: 'Focus on technical depth, problem-solving and hands-on knowledge.',
  hr: 'Focus on behavioural and situational questions; expect STAR-style answers and culture fit.',
  managerial: 'Focus on leadership, stakeholder management, prioritisation and decision-making.',
  domain: 'Focus on domain knowledge, requirements and real-world scenarios in this industry.',
}

export function isSenior(seniority?: string | null): boolean {
  return seniority === 'experienced' || seniority === 'lead'
}

// Builds the grounding block injected into the generation prompt.
export function buildInterviewContext(ctx: InterviewContext): string {
  const lines: string[] = []
  lines.push(`Skill track: ${ctx.trackName}${ctx.category ? ` (${ctx.category})` : ''}`)
  if (ctx.seniority) lines.push(`Seniority: ${ctx.seniority}`)
  if (ctx.roundType) {
    lines.push(`Round type: ${ctx.roundType}`)
    if (ROUND_FOCUS[ctx.roundType]) lines.push(ROUND_FOCUS[ctx.roundType])
  }
  if (ctx.companyName) {
    lines.push(
      `Company: ${ctx.companyName}. Calibrate to its publicly documented interview pattern${ctx.companyNotes ? ` (${ctx.companyNotes})` : ''}. Do NOT reproduce real or leaked questions — create original ones in that style.`
    )
  }
  if (isSenior(ctx.seniority) && ctx.jobDescription?.trim()) {
    lines.push(
      `Target role${ctx.jobTitle ? `: ${ctx.jobTitle}` : ''}. Tailor questions to the responsibilities, skills and seniority described in this job description:\n"""\n${ctx.jobDescription.trim()}\n"""`
    )
  }
  if (isSenior(ctx.seniority) && ctx.resumeText?.trim()) {
    lines.push(
      `Candidate résumé. Personalise questions to their actual experience and probe the gap between what the role needs and what the candidate has done — reference their real projects and claims:\n"""\n${ctx.resumeText.trim()}\n"""`
    )
  }
  return lines.join('\n')
}
