import { createClient } from '@supabase/supabase-js'

function clean(s: string | undefined, fallback: string): string {
  return (s ?? '').replace(/[^\x20-\x7E]/g, '').trim() || fallback
}

// Server-only admin client — bypasses RLS, use only in API routes (never in Client Components)
export const supabaseAdmin = createClient(
clean(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://bnxshcckbasylmvbsagc.supabase.co'),
clean(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'eyJhbGci•••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••')
)
