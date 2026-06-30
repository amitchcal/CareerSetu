// Validation Gate — claude-haiku-4-5, cheap gatekeeper
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { MarketProfile } from '@/lib/market';

const client = new Anthropic();

import { readFileSync } from 'fs';
import path from 'path';

function loadPrompt(filename: string): string {
  return readFileSync(path.join(process.cwd(), 'docs', 'prompts', filename), 'utf-8');
}

const SYSTEM_PROMPT = loadPrompt('dna-and-validation.md');

export const ValidationOutputSchema = z.object({
  ok: z.boolean(),
  missing: z.array(z.string()),
  cultural_confirmations: z.array(z.string()),
  normalized_units: z.string(),
  style_pref_normalized: z.string(),
});

export type ValidationOutput = z.infer<typeof ValidationOutputSchema>;

export async function runValidationEngine(input: {
  market_profile: MarketProfile;
  intake: Record<string, unknown>;
}): Promise<ValidationOutput> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(input) }],
  });

  const text = (message.content[0] as { type: 'text'; text: string }).text;
  const parsed = JSON.parse(text);
  return ValidationOutputSchema.parse(parsed);
}
