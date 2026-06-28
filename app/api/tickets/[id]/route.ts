import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'
)

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'CareerSetu Support <support@careersetu.in>',
      to,
      subject,
      html,
    }),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { status, adminComment } = body

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .update({ status, admin_comment: adminComment })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'closed' && data.email) {
    await sendEmail(
      data.email,
      `Your ticket ${data.ticket_ref} has been resolved`,
      `<p>Hi ${data.name},</p>
      <p>Your support ticket <strong>${data.ticket_ref}</strong> has been resolved and closed.</p>
      ${adminComment ? `<p><strong>Admin comment:</strong> ${adminComment}</p>` : ''}
      <p>If you have further issues, feel free to raise a new ticket.</p>
      <p>— CareerSetu Support Team</p>`
    )
  }

  return NextResponse.json({ ticket: data })
}
