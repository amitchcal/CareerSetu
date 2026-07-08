import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function clean(s: string | undefined, fallback: string): string {
  return (s ?? '').replace(/[^\x20-\x7E]/g, '').trim() || fallback
}

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
  clean(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://bnxshcckbasylmvbsagc.supabase.co'),
clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'eyJhbGci••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'),
    {
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
    }
  )
}
