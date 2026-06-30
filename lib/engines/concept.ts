// Concept Engine — claude-sonnet-4-6, temp 0.7
// Loads master.md + concept-engine.md system prompts.
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { MarketProfile } from '@/lib/market';

const client = new Anthropic();

// --- Zod schema (source of truth for engine output) ---
export const RenderBriefSchema = z.object({
  camera_angles: z.array(z.string()),
  lighting: z.string(),
  key_materials: z.array(z.string()),
  palette: z.array(z.string()),
});

export const ConceptRoomSchema = z.object({
  name: z.string(),
  zoning_rationale: z.string(),
  style_direction: z.string(),
  key_features: z.array(z.string()),
  cultural_notes: z.array(z.string()),
  clearance_flags: z.array(z.string()),
  render_brief: RenderBriefSchema,
});

export const ConceptOutputSchema = z.object({
  rooms: z.array(ConceptRoomSchema),
  overall_direction: z.string(),
  applied_cultural_rules: z.array(z.string()),
  assumptions: z.array(z.string()),
});

export type ConceptOutput = z.infer<typeof ConceptOutputSchema>;

// --- Prompt loading ---
import { readFileSync } from 'fs';
import path from 'path';

function loadPrompt(filename: string): string {
  return readFileSync(path.join(process.cwd(), 'docs', 'prompts', filename), 'utf-8');
}

const SYSTEM_PROMPT = [loadPrompt('master.md'), loadPrompt('concept-engine.md')].join('\n\n');

// --- Engine call ---
export async function runConceptEngine(input: {
  market_profile: MarketProfile;
  intake: Record<string, unknown>;
  designer_dna?: Record<string, unknown>;
}): Promise<ConceptOutput> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    temperature: 0.7,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(input) }],
  });

  const text = (message.content[0] as { type: 'text'; text: string }).text;
  const parsed = JSON.parse(text);
  return ConceptOutputSchema.parse(parsed);
}
