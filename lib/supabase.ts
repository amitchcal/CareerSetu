import { createBrowserClient } from '@supabase/ssr'

// Fallback values let createBrowserClient succeed during `next build` static
// analysis when env vars haven't been injected yet. At runtime on Vercel the
// real values are always present.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

// Browser client — use in Client Components only
export const supabase = createBrowserClient(url, anonKey)
