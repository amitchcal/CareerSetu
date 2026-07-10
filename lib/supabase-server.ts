import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Anon key is public-safe (ships in the browser bundle). Hardcoded so a
// missing/corrupted Vercel env var can never break server-side auth.
const SUPABASE_URL = 'https://bnxshcckbasylmvbsagc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJueHNoY2NrYmFzeWxtdmJzYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NjM1NjcsImV4cCI6MjA5ODAzOTU2N30.37XsyjI-1rAohQ2eZiF58dEZ42xvzFn7Bzpp9nRKFto'

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component — cookies can't be set here; middleware handles refresh
        }
      },
    },
  })
}
