import { createBrowserClient } from '@supabase/ssr'

// Fallback values let createBrowserClient succeed during `next build` static
// analysis when env vars haven't been injected yet. At runtime on Vercel the
// real values are always present.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

// Browser client — use in Client Components only.
// detectSessionInUrl is disabled so the OAuth code is exchanged exactly once,
// manually, in app/auth/callback/page.tsx. With the default (true) the client
// auto-exchanges the code on page load AND our manual call runs too — the
// second consumer fails because the single-use code is already spent, which
// surfaced as ?error=auth_failed after Google sign-in.
export const supabase = createBrowserClient(url, anonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
})
