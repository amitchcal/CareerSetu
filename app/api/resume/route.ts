import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/auth'

// GET /api/resume — list the authenticated user's resumes
export async function GET() {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('id, title, is_default, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Could not load resumes.' }, { status: 500 })
  return NextResponse.json({ resumes: data })
}

// POST /api/resume — create a new resume for the authenticated user
export async function POST(req: Request) {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const body = await req.json()
  const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : 'My Resume'

  // First resume is auto-set as default
  const { count } = await supabaseAdmin
    .from('resumes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data, error } = await supabaseAdmin
    .from('resumes')
    .insert({ user_id: user.id, title, is_default: count === 0 })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Could not create resume.' }, { status: 500 })
  return NextResponse.json({ resumeId: data.id })
}
