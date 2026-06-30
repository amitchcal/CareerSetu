// Designer DNA Engine — claude-sonnet-4-6 vision, batch
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const client = new Anthropic();

import { readFileSync } from 'fs';
import path from 'path';

function loadPrompt(filename: string): string {
  return readFileSync(path.join(process.cwd(), 'docs', 'prompts', filename), 'utf-8');
}

const SYSTEM_PROMPT = loadPrompt('dna-and-validation.md');

export const DnaOutputSchema = z.object({
  preferred_materials: z.array(z.string()),
  preferred_colors: z.array(z.string()),
  preferred_layout_patterns: z.array(z.string()),
  signature_elements: z.array(z.string()),
  style_name: z.string(),
  confidence_note: z.string(),
});

export type DnaOutput = z.infer<typeof DnaOutputSchema>;

export async function runDnaEngine(assetUrls: string[]): Promise<DnaOutput> {
  const imageContent = assetUrls.map((url) => ({
    type: 'image' as const,
    source: { type: 'url' as const, url },
  }));

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: 'Extract the Designer DNA from these project images. Return strict JSON per the schema.',
          },
        ],
      },
    ],
  });

  const text = (message.content[0] as { type: 'text'; text: string }).text;
  const parsed = JSON.parse(text);
  return DnaOutputSchema.parse(parsed);
}
