'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'

// ─── Plan config (mirrors /pricing) ───────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'Rs.0',
    period: null,
    desc: 'Get started with no commitment',
    features: ['1 interview / week', '1 role category', 'English only', 'Basic feedback'],
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 'Rs.199',
    period: '/month',
    desc: 'For consistent daily practice',
    features: ['Unlimited interviews', '3-5 role categories', 'English + Hindi', 'Full feedback'],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'Rs.499',
    period: '/month',
    desc: 'For serious interview prep',
    features: ['Unlimited interviews', 'All roles', 'English, Hindi, Hinglish', 'Full + company-style simulation'],
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'pay_per',
    name: 'Pay-per-session',
    price: 'Rs.49-99',
    period: '/session',
    desc: 'Pay only when you need it',
    features: ['1 session', 'All roles', 'Selected language', 'Full feedback'],
    highlight: false,
  },
]

const PAID_PLANS = ['starter', 'pro']

// ─── Razorpay types ───────────────────────────────────────────────────────────

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SubData {
  userId: string
  userEmail: string | null
  userName: string | null
  plan: string
  status: string
  renewalDate: string | null
  createdAt: string | null
  sessionsThisWeek: number
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [data, setData] = useState<SubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }

    const userId = session.user.id
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)

    const [{ data: sub }, { count: sessCount }] = await Promise.all([
      supabase.from('subscriptions').select('plan, status, renewal_date, created_at').eq('user_id', userId).maybeSingle(),
      supabase.from('sessions').select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', weekAgo.toISOString()),
    ])

    setData({
      userId,
      userEmail: session.user.email ?? null,
      userName: session.user.user_metadata?.full_name ?? null,
      plan: sub?.plan ?? 'free',
      status: sub?.status ?? 'active',
      renewalDate: sub?.renewal_date ?? null,
      createdAt: sub?.created_at ?? null,
      sessionsThisWeek: sessCount ?? 0,
    })
    setLoading(false)
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  // ── Razorpay checkout ──────────────────────────────────────────────────────

  async function handleUpgrade(planId: string) {
    if (!data) return
    setUpgrading(planId)

    try {
      // 1. Create order server-side
      const orderRes = await fetch('/api/subscription/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        if (orderData.error === 'Razorpay keys not configured.') {
          toast({ title: 'Payment unavailable', description: 'Razorpay test keys are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local.', variant: 'destructive' })
        } else {
          throw new Error(orderData.error)
        }
        setUpgrading(null)
        return
      }

      // 2. Load Razorpay script
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Failed to load payment SDK.')

      // 3. Open checkout
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: keyId,
          order_id: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'CareerSetu',
          description: `${PLANS.find(p => p.id === planId)?.name} Plan`,
          prefill: { email: data.userEmail ?? '', name: data.userName ?? '' },
          theme: { color: '#4F46E5' },
          handler: async (response: { razorpay_payment_id: string }) => {
            try {
              // 4. Confirm upgrade
              const res = await fetch('/api/subscription/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.userId, plan: planId, paymentRef: response.razorpay_payment_id }),
              })
              if (!res.ok) throw new Error((await res.json()).error)
              toast({ title: 'Upgraded!', description: `You are now on the ${PLANS.find(p => p.id === planId)?.name} plan.` })
              await loadData()
              resolve()
            } catch (e) { reject(e) }
          },
          modal: { ondismiss: () => resolve() },
        })
        rzp.open()
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed.'
      toast({ title: 'Payment failed', description: message, variant: 'destructive' })
    } finally {
      setUpgrading(null)
    }
  }

  // ── Cancel subscription ────────────────────────────────────────────────────

  async function handleCancel() {
    if (!data) return
    setCancelling(true)
    try {
      // TODO: For full invoice/cancellation history, create a `cancellations` table
      // storing { user_id, reason, cancelled_at } — deferred to post-MVP.
      if (cancelReason.trim()) {
        console.log('[cancel reason]', cancelReason.trim())
      }

      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', data.userId)

      if (error) throw error

      toast({ title: 'Subscription cancelled', description: 'You have been moved to the Free plan.' })
      setShowCancel(false)
      setCancelReason('')
      await loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not cancel.'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setCancelling(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  const currentPlan = PLANS.find(p => p.id === data!.plan) ?? PLANS[0]
  const isCancelled = data!.status === 'cancelled'
  const isPaid = PAID_PLANS.includes(data!.plan)

  return (
    <>
      {/* Cancel confirmation dialog */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Cancel subscription?</h2>
              <button onClick={() => setShowCancel(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              You will lose access to paid features at the end of your billing period. Your session history is always saved.
            </p>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Why are you leaving? <span className="text-gray-400">(optional)</span></label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Your feedback helps us improve..."
                className="w-full rounded-xl border-2 border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancel(false)}
                className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-8">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your plan and billing.</p>
        </div>

        {/* Current plan summary */}
        <div className={`rounded-2xl border-2 bg-white p-6 shadow-sm ${currentPlan.highlight ? 'border-amber-400' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900">{currentPlan.name} Plan</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isCancelled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {isCancelled ? 'Cancelled' : 'Active'}
                </span>
              </div>
              {data!.renewalDate && !isCancelled && (
                <p className="text-sm text-gray-500">
                  Renews on {new Date(data!.renewalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {data!.plan === 'free' && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-1.5">Usage this week</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[120px] h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${Math.min((data!.sessionsThisWeek / 1) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{data!.sessionsThisWeek} / 1 session</span>
                  </div>
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-gray-900">{currentPlan.price}</p>
              {currentPlan.period && <p className="text-xs text-gray-400">{currentPlan.period}</p>}
            </div>
          </div>

          {/* Cancel button — only for active paid plans */}
          {isPaid && !isCancelled && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <button
                onClick={() => setShowCancel(true)}
                className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Cancel subscription
              </button>
            </div>
          )}
        </div>

        {/* Plan options */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Change plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLANS.filter(p => p.id !== 'pay_per').map((plan) => {
              const isCurrent = plan.id === data!.plan
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 bg-white p-5 ${
                    plan.highlight ? 'border-amber-400' : isCurrent ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  {plan.highlight && plan.badge && (
                    <span className="absolute -top-3 left-4 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={`text-sm font-semibold ${plan.highlight ? 'text-amber-600' : 'text-indigo-600'}`}>{plan.name}</p>
                      <p className="text-xl font-bold text-gray-900">{plan.price}<span className="text-xs font-normal text-gray-400">{plan.period}</span></p>
                    </div>
                    {isCurrent ? (
                      <span className="flex items-center gap-1 rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Current
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.id === 'free' ? 'free' : plan.id)}
                        disabled={!!upgrading || plan.id === 'free'}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                          plan.highlight
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : plan.id === 'free'
                            ? 'border border-gray-200 text-gray-400 cursor-default'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {upgrading === plan.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                      </button>
                    )}
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Check className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        {/* Billing history */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Billing history</h2>
          {/* TODO: For full invoice history, integrate Razorpay webhook to store payment events
              in a `payments` table and list them here. Currently shows only subscription start. */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {data!.createdAt ? (
                  <tr className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(data!.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 capitalize">{data!.plan}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isCancelled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isCancelled ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {isCancelled ? 'Cancelled' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">No payment history — you are on the Free plan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </>
  )
}
