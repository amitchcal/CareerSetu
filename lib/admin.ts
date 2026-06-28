import { createSupabaseServerClient } from '@/lib/supabase-server'

// Comma-separated allowlist. Server-only enforcement lives here; the admin UI
// uses NEXT_PUBLIC_ADMIN_EMAILS purely to decide whether to render the page.
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

// Returns the authenticated admin user, or null if not signed in / not an admin.
export async function getAdminUser() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}
