import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/resume?userId=xxx  — list user's resumes
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('id, title, is_default, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resumes: data })
}

// POST /api/resume  — create new resume
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, title = 'My Resume' } = body
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  // Check if this is the user's first resume — auto-set as default
  const { count } = await supabaseAdmin
    .from('resumes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { data, error } = await supabaseAdmin
    .from('resumes')
    .insert({ user_id: userId, title, is_default: count === 0 })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resumeId: data.id })
}
