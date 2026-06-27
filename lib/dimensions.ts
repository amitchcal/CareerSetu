// Unified performance dimensions — the shared vocabulary that BOTH interview
// competency scores and MCQ topic results roll up into, so Reports (P5.1) can show
// one coherent picture of a candidate across practice modes.
//
// Mapping summary:
//   Interview competency (P4.1) ── COMPETENCY_TO_DIMENSION ──► unified dimension
//   MCQ test (by track category) ── mcqCategoryToDimension ──► unified dimension
// All values are normalised to a 0–10 scale before aggregation.

export interface Dimension {
  key: string
  label: string
}

export const UNIFIED_DIMENSIONS: Dimension[] = [
  { key: 'technical', label: 'Technical' },
  { key: 'knowledge_depth', label: 'Knowledge depth' },
  { key: 'problem_solving', label: 'Problem-solving' },
  { key: 'communication', label: 'Communication' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'domain', label: 'Domain knowledge' },
  { key: 'management', label: 'Management & leadership' },
]

export const DIMENSION_LABELS: Record<string, string> = Object.fromEntries(
  UNIFIED_DIMENSIONS.map((d) => [d.key, d.label])
)

// Interview competency key → unified dimension
export const COMPETENCY_TO_DIMENSION: Record<string, string> = {
  knowledge_depth: 'knowledge_depth',
  problem_solving: 'problem_solving',
  analytical_thinking: 'problem_solving',
  communication: 'communication',
  confidence: 'communication',
  structure_star: 'communication',
  self_awareness: 'communication',
  culture_fit: 'communication',
  clarity: 'clarity',
  domain_knowledge: 'domain',
  requirements_rigor: 'domain',
  stakeholder_management: 'management',
  prioritization: 'management',
  leadership: 'management',
  decision_making: 'management',
}

// MCQ track category → the unified dimension its accuracy contributes to
export function mcqCategoryToDimension(category: string | null | undefined): string {
  switch (category) {
    case 'software': return 'technical'
    case 'project_mgmt':
    case 'agile': return 'management'
    case 'business_analyst': return 'domain'
    default: return 'technical'
  }
}

// Average a single session's competency scores into unified dimensions (0–10).
export function competencyScoresToDimensions(scores: Record<string, number> | null | undefined): Record<string, number> {
  const acc: Record<string, { sum: number; count: number }> = {}
  for (const [k, v] of Object.entries(scores ?? {})) {
    const dim = COMPETENCY_TO_DIMENSION[k]
    if (!dim || typeof v !== 'number') continue
    if (!acc[dim]) acc[dim] = { sum: 0, count: 0 }
    acc[dim].sum += v
    acc[dim].count += 1
  }
  const out: Record<string, number> = {}
  for (const [dim, { sum, count }] of Object.entries(acc)) out[dim] = sum / count
  return out
}

// Convert an MCQ test's accuracy (0–100%) for a track category into a dimension contribution.
export function mcqResultToDimensions(category: string | null | undefined, percent: number): Record<string, number> {
  return { [mcqCategoryToDimension(category)]: Math.max(0, Math.min(100, percent)) / 10 }
}

// Aggregate many per-session contributions (each Record<dimension, 0–10>) into an
// averaged scorecard with the count of contributing sessions per dimension.
export function aggregateDimensions(
  contributions: Record<string, number>[]
): Record<string, { value: number; count: number }> {
  const acc: Record<string, { sum: number; count: number }> = {}
  for (const c of contributions) {
    for (const [dim, v] of Object.entries(c)) {
      if (typeof v !== 'number' || Number.isNaN(v)) continue
      if (!acc[dim]) acc[dim] = { sum: 0, count: 0 }
      acc[dim].sum += v
      acc[dim].count += 1
    }
  }
  const out: Record<string, { value: number; count: number }> = {}
  for (const [dim, { sum, count }] of Object.entries(acc)) {
    out[dim] = { value: Math.round((sum / count) * 10) / 10, count }
  }
  return out
}
