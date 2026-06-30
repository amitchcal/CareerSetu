// Proposal Engine — claude-sonnet-4-6, temp 0.5
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { MarketProfile } from '@/lib/market';
import type { ConceptOutput } from './concept';
import type { BoqOutput } from './boq';

const client = new Anthropic();

import { readFileSync } from 'fs';
import path from 'path';

function loadPrompt(filename: string): string {
  return readFileSync(path.join(process.cwd(), 'docs', 'prompts', filename), 'utf-8');
}

const SYSTEM_PROMPT = [loadPrompt('master.md'), loadPrompt('proposal-engine.md')].join('\n\n');

export const ProposalRoomSchema = z.object({
  name: z.string(),
  summary: z.string(),
  highlights: z.array(z.string()),
});

export const ProposalOutputSchema = z.object({
  title: z.string(),
  intro: z.string(),
  rooms: z.array(ProposalRoomSchema),
  investment_summary: z.string(),
  value_engineering_note: z.string().nullable(),
  next_steps: z.array(z.string()),
  disclaimer: z.string(),
});

export type ProposalOutput = z.infer<typeof ProposalOutputSchema>;

export async function runProposalEngine(input: {
  market_profile: MarketProfile;
  intake: Record<string, unknown>;
  concept: ConceptOutput;
  boq: BoqOutput;
  designer_brand: string;
}): Promise<ProposalOutput> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    temperature: 0.5,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(input) }],
  });

  const text = (message.content[0] as { type: 'text'; text: string }).text;
  const parsed = JSON.parse(text);
  return ProposalOutputSchema.parse(parsed);
}
