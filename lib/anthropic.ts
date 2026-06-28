import Anthropic from '@anthropic-ai/sdk'

// Strip a leading BOM (U+FEFF), zero-width chars, and surrounding whitespace.
// A BOM pasted into the Vercel env var made the SDK throw
// "Cannot convert argument to a ByteString ... value of 65279" when building
// the Authorization header, which broke every AI-powered feature.
function cleanKey(raw: string | undefined): string {
  return (raw ?? '')
    .replace(/[﻿​‌‍⁠]/g, '') // BOM, ZWSP, ZWNJ, ZWJ, word-joiner
    .replace(/[^\x20-\x7E]/g, '')                     // drop any remaining non-ASCII
    .trim()
}

export const anthropic = new Anthropic({
  apiKey: cleanKey(process.env.ANTHROPIC_API_KEY),
})
