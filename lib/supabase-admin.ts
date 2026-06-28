import { createClient } from '@supabase/supabase-js'

// Server-only admin client — bypasses RLS, use only in API routes (never in Client Components)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'
)
