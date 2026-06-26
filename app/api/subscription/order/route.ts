import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const PLAN_AMOUNTS: Record<string, number> = {
  starter: 19900, // paise (Rs.199)
  pro: 49900,     // paise (Rs.499)
}

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json()

    const amount = PLAN_AMOUNTS[plan]
    if (!amount) return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret || keyId === 'your_razorpay_key_id') {
      return NextResponse.json({ error: 'Razorpay keys not configured.' }, { status: 503 })
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `careersetu_${plan}_${Date.now()}`,
    })

    return NextResponse.json({ orderId: order.id, amount, currency: 'INR' })
  } catch (err: unknown) {
    console.error('[subscription/order]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
