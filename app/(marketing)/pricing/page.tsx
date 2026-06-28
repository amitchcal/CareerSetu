import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const metadata: Metadata = {
  title: 'Pricing — Free, Starter & Pro Plans',
  description:
    'CareerSetu pricing: start free with 1 mock interview per week. Upgrade to Starter (₹199/mo) for unlimited interviews or Pro (₹499/mo) for all roles and Hinglish support. No lock-in.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'CareerSetu Pricing — Free, Starter & Pro Plans',
    description: 'Start free. Upgrade for unlimited AI mock interviews and detailed feedback.',
    url: '/pricing',
  },
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: null,
    tagline: 'Forever free',
    features: [
      '1 mock interview / week',
      '1 role category',
      'English only',
      'Basic AI feedback report',
    ],
    cta: 'Get started free',
    href: '/signup',
    highlight: false,
    badge: null,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '₹199',
    period: '/month',
    tagline: 'For consistent daily practice',
    features: [
      'Unlimited mock interviews',
      '3–5 role categories',
      'English + Hindi',
      'Detailed per-question feedback',
      'Progress tracking',
    ],
    cta: 'Start free trial',
    href: '/signup',
    highlight: false,
    badge: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹499',
    period: '/month',
    tagline: 'For serious interview prep',
    features: [
      'Unlimited mock interviews',
      'All role categories',
      'English, Hindi & Hinglish',
      'Full + company-style simulation',
      'Priority feedback generation',
      'Progress analytics dashboard',
    ],
    cta: 'Get Pro',
    href: '/signup',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'pay_per',
    name: 'Pay-per-session',
    price: '₹49–99',
    period: '/session',
    tagline: 'Pay only when you need it',
    features: [
      '1 session per purchase',
      'All role categories',
      'Language of your choice',
      'Full AI feedback report',
    ],
    cta: 'Buy a session',
    href: '/signup',
    highlight: false,
    badge: null,
  },
]

const FAQS = [
  {
    q: 'Is there a free trial on paid plans?',
    a: 'Yes — Starter includes a 7-day free trial. No credit card required to start.',
  },
  {
    q: 'Can I switch plans at any time?',
    a: 'Absolutely. You can upgrade, downgrade, or cancel anytime from your account settings. Downgrades take effect at the end of your billing cycle.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept UPI, credit/debit cards, net banking, and all major wallets via Razorpay.',
  },
  {
    q: 'Is the AI feedback really honest?',
    a: 'Yes. We deliberately instruct our AI to avoid generic praise and give calibrated, specific feedback — the same way an experienced hiring manager would.',
  },
  {
    q: 'Do unused sessions roll over?',
    a: 'On the Free plan, the weekly interview limit resets every 7 days. On paid plans, interviews are unlimited so rollover is not applicable.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, no lock-in. Cancel from Settings → Subscription and you keep access until your billing period ends.',
  },
]

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="bg-gray-50">

        {/* Hero */}
        <section className="bg-white border-b border-gray-100 py-16 px-4 text-center">
          <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-4">
            Pricing
          </span>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Simple, honest pricing</h1>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            No hidden fees. Cancel anytime. Start free — upgrade when you need more.
          </p>
        </section>

        {/* Plan cards */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-sm transition-transform ${
                  plan.highlight
                    ? 'border-amber-400 shadow-amber-100 shadow-lg lg:scale-[1.04]'
                    : 'border-gray-200'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow">
                    {plan.badge}
                  </span>
                )}

                <div className="mb-5">
                  <p className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-amber-600' : 'text-indigo-600'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-sm text-gray-400 mb-1">{plan.period}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{plan.tagline}</p>
                </div>

                <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-amber-500' : 'text-indigo-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                      : 'border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-2xl px-4 pb-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="flex flex-col gap-2">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-gray-200 bg-white px-5 shadow-sm">
                <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-600 pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA strip */}
        <section className="bg-indigo-600 py-14 px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to start practising?</h2>
          <p className="text-indigo-200 mb-6 text-sm">No credit card required. Get your first session in under 2 minutes.</p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-8 py-4 text-base font-semibold text-white hover:bg-amber-600 transition-all shadow-md"
          >
            Start Free Practice
          </Link>
        </section>

      </main>
      <Footer />
    </>
  )
}
