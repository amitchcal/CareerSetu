import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/admin'

interface ReviewBody {
  id: string
  action: 'approve' | 'reject'
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

    const { id, action } = (await req.json()) as ReviewBody
    if (!id || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }

    if (action === 'approve') {
      const { error } = await supabaseAdmin
        .from('questions')
        .update({ status: 'approved' })
        .eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabaseAdmin.from('questions').delete().eq('id', id)
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[admin/questions/review]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
