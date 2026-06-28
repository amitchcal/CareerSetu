import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Creates a proxy that defers client instantiation until first property access.
// This prevents Next.js build from failing when env vars aren't yet injected
// (e.g. during "Collecting page data" with module-level initialisation).
function makeLazy<T extends object>(factory: () => T): T {
  let instance: T | null = null
  return new Proxy({} as T, {
    get(_, prop: string | symbol) {
      if (!instance) instance = factory()
      const val = (instance as Record<string | symbol, unknown>)[prop]
      return typeof val === 'function' ? (val as (...args: unknown[]) => unknown).bind(instance) : val
    },
    set(_, prop: string | symbol, value: unknown) {
      if (!instance) instance = factory()
      ;(instance as Record<string | symbol, unknown>)[prop] = value
      return true
    },
  })
}

export const supabase = makeLazy<ReturnType<typeof createBrowserClient>>(() =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
)

export const supabaseAdmin = makeLazy<SupabaseClient>(() =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
)
