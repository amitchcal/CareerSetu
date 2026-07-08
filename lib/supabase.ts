import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://bnxshcckbasylmvbsagc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJueHNoY2NrYmFzeWxtdmJzYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NjM1NjcsImV4cCI6MjA5ODAzOTU2N30.37XsyjI-1rAohQ2eZiF58dEZ42xvzFn7Bzpp9nRKFto'

export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
})
