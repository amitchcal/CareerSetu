import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, phone, criticality, description, screenshotUrl, userId } = body

  if (!name || !email || !criticality || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .insert({ name, email, phone: phone || null, criticality, description, screenshot_url: screenshotUrl || null, user_id: userId || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Email to user
  await sendEmail(
    email,
    `Your ticket ${data.ticket_ref} has been received`,
    `<p>Hi ${name},</p>
    <p>Thank you for reaching out. We have received your ticket.</p>
    <p><strong>Ticket ID:</strong> ${data.ticket_ref}<br/>
    <strong>Criticality:</strong> ${criticality}<br/>
    <strong>Status:</strong> Open</p>
    <p>We will get back to you soon.</p>
    <p>— CareerSetu Support Team</p>`
  )

  // Email to admins
  for (const adminEmail of ADMIN_EMAILS) {
    await sendEmail(
      adminEmail,
      `[${data.ticket_ref}] New ${criticality} ticket from ${name}`,
      `<p>A new support ticket has been raised.</p>
      <p><strong>Ticket:</strong> ${data.ticket_ref}<br/>
      <strong>From:</strong> ${name} (${email})<br/>
      <strong>Phone:</strong> ${phone || 'N/A'}<br/>
      <strong>Criticality:</strong> ${criticality}<br/>
      <strong>Description:</strong></p>
      <p>${description}</p>
      ${screenshotUrl ? `<p><a href="${screenshotUrl}">View Screenshot</a></p>` : ''}
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/issues">View in Admin Panel</a></p>`
    )
  }

  return NextResponse.json({ ticket: data })
}

export async function GET(req: NextRequest) {
  // Admin only — verify caller is admin
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  let query = supabaseAdmin.from('support_tickets').select('*').order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tickets: data })
}
