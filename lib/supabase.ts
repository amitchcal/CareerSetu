import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — use in Client Components
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Plain client — use in API routes / server actions that don't need cookie-based sessions
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey)
