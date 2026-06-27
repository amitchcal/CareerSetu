// Competency dimensions for interview scoring, chosen by round type, track category
// and seniority. Keys are stored in session_feedback.competency_scores; labels are
// used for display (P4.2 radar/report).

export const COMPETENCY_LABELS: Record<string, string> = {
  knowledge_depth: 'Knowledge depth',
  problem_solving: 'Problem-solving',
  communication: 'Communication',
  clarity: 'Clarity',
  confidence: 'Confidence',
  domain_knowledge: 'Domain knowledge',
  stakeholder_management: 'Stakeholder management',
  prioritization: 'Prioritisation',
  requirements_rigor: 'Requirements rigour',
  analytical_thinking: 'Analytical thinking',
  structure_star: 'Structure (STAR)',
  self_awareness: 'Self-awareness',
  culture_fit: 'Culture fit',
  leadership: 'Leadership',
  decision_making: 'Decision-making',
}

const HR_SET = ['structure_star', 'self_awareness', 'communication', 'confidence', 'culture_fit']
const MANAGERIAL_SET = ['leadership', 'stakeholder_management', 'decision_making', 'communication', 'clarity']
const SOFTWARE_SET = ['knowledge_depth', 'problem_solving', 'communication', 'clarity', 'confidence']
const PM_AGILE_SET = ['domain_knowledge', 'stakeholder_management', 'prioritization', 'communication', 'clarity']
const BA_SET = ['domain_knowledge', 'requirements_rigor', 'analytical_thinking', 'communication', 'clarity']

interface PickOpts {
  category?: string | null // track category
  roundType?: string | null
  seniority?: string | null
}

export function pickCompetencies({ category, roundType, seniority }: PickOpts): string[] {
  let keys: string[]
  if (roundType === 'hr') keys = [...HR_SET]
  else if (roundType === 'managerial') keys = [...MANAGERIAL_SET]
  else {
    switch (category) {
      case 'software': keys = [...SOFTWARE_SET]; break
      case 'project_mgmt':
      case 'agile': keys = [...PM_AGILE_SET]; break
      case 'business_analyst': keys = [...BA_SET]; break
      case 'hr': keys = [...HR_SET]; break
      default: keys = [...SOFTWARE_SET]
    }
  }
  // Senior candidates are also assessed on leadership and decision-making
  if (seniority === 'experienced' || seniority === 'lead') {
    for (const k of ['leadership', 'decision_making']) if (!keys.includes(k)) keys.push(k)
  }
  return keys
}
