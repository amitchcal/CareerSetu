import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/resume/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ resume: data })
}

// PUT /api/resume/[id]  — full or partial update
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { userId, ...fields } = body
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('resumes')
    .update(fields)
    .eq('id', params.id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: 'Could not load resume.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/resume/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('resumes')
    .delete()
    .eq('id', params.id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: 'Could not load resume.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
