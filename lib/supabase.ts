import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://bnxshcckbasylmvbsagc.supabase.co'.replace(/[^\x20-\x7E]/g, '')
const SUPABASE_ANON_KEY = 'eyJhbGci••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'.replace(/[^\x20-\x7E]/g, '')

export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
})
