import { createBrowserClient } from '@supabase/ssr'

// Strip BOM (U+FEFF), zero-width chars, and any non-ASCII from env vars.
// Env vars pasted into Vercel can carry an invisible BOM which causes fetch
// to throw "String contains non ISO-8859-1 code point" in the browser.
function clean(s: string | undefined, fallback: string): string {
  return (s ?? '').replace(/[^\x20-\x7E]/g, '').trim() || fallback
}

const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://placeholder.supabase.co')
const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'placeholder-anon-key')

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
