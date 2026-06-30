// BOQ Engine — claude-sonnet-4-6, temp 0.2
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { MarketProfile, RateLibraryItem } from '@/lib/market';
import type { ConceptOutput } from './concept';

const client = new Anthropic();

import { readFileSync } from 'fs';
import path from 'path';

function loadPrompt(filename: string): string {
  return readFileSync(path.join(process.cwd(), 'docs', 'prompts', filename), 'utf-8');
}

const SYSTEM_PROMPT = [loadPrompt('master.md'), loadPrompt('boq-engine.md')].join('\n\n');

export const BoqItemSchema = z.object({
  room: z.string(),
  item_code: z.string().nullable(),
  spec: z.string(),
  qty: z.number(),
  unit: z.string(),
  rate_minor: z.number().int(),
  amount_minor: z.number().int(),
  tier: z.enum(['economy', 'premium', 'luxury']),
});

export const ValueEngOptionSchema = z.object({
  label: z.string(),
  delta_minor: z.number().int(),
  note: z.string(),
});

export const BoqOutputSchema = z.object({
  items: z.array(BoqItemSchema),
  subtotal_minor: z.number().int(),
  tax_minor: z.number().int(),
  total_minor: z.number().int(),
  currency: z.string(),
  budget_total_minor: z.number().int(),
  budget_delta_minor: z.number().int(),
  value_engineering: z.array(ValueEngOptionSchema),
  assumptions: z.array(z.string()),
});

export type BoqOutput = z.infer<typeof BoqOutputSchema>;

export async function runBoqEngine(input: {
  market_profile: MarketProfile;
  intake: Record<string, unknown>;
  concept: ConceptOutput;
  rate_library: RateLibraryItem[];
}): Promise<BoqOutput> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(input) }],
  });

  const text = (message.content[0] as { type: 'text'; text: string }).text;
  const parsed = JSON.parse(text);
  return BoqOutputSchema.parse(parsed);
}
