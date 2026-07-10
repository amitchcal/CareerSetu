import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * Returns the authenticated user for the current request, or null.
 * Use this in every protected API route instead of trusting a userId
 * supplied in the request body (which is spoofable).
 */
export async function getAuthedUser() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
