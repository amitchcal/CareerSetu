import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { userId, plan, paymentRef } = await req.json()
    if (!userId || !plan || !paymentRef) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    const renewalDate = new Date()
    renewalDate.setMonth(renewalDate.getMonth() + 1)

    // Upsert subscription row
    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          plan,
          status: 'active',
          renewal_date: renewalDate.toISOString().split('T')[0],
          payment_gateway_ref: paymentRef,
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('[subscription/upgrade]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[subscription/upgrade]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
