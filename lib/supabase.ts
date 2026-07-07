import { createClient } from '@supabase/supabase-js'

// Fallback placeholders prevent build-time crash when env vars are absent.
// At runtime, missing vars will cause auth calls to fail gracefully.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
