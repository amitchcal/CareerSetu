import Link from 'next/link'
import { Check, Zap } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: null,
    desc: 'Get started with no commitment',
    cta: 'Start Free',
    ctaHref: '/signup',
    highlight: false,
    features: {
      interviews: '1 per week',
      roles: '1 role',
      languages: 'English only',
      feedback: 'Basic',
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '199',
    period: '/month',
    desc: 'For consistent daily practice',
    cta: 'Upgrade',
    ctaHref: '/subscription',
    highlight: false,
    features: {
      interviews: 'Unlimited',
      roles: '3-5 roles',
      languages: 'English + Hindi',
      feedback: 'Full',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '499',
    period: '/month',
    desc: 'For serious interview prep',
    cta: 'Upgrade',
    ctaHref: '/subscription',
    highlight: true,
    badge: 'Most Popular',
    features: {
      interviews: 'Unlimited',
      roles: 'All roles',
      languages: 'English, Hindi, Hinglish',
      feedback: 'Full + company-style simulation',
    },
  },
  {
    id: 'pay_per',
    name: 'Pay-per-session',
    price: '49-99',
    period: '/session',
    desc: 'Pay only when you need it',
    cta: 'Buy Session',
    ctaHref: '/subscription',
    highlight: false,
    features: {
      interviews: '1 session',
      roles: 'All roles',
      languages: 'Selected language',
      feedback: 'Full',
    },
  },
]

const ROWS: { label: string; key: keyof typeof PLANS[0]['features'] }[] = [
  { label: 'Mock interviews', key: 'interviews' },
  { label: 'Role categories', key: 'roles' },
  { label: 'Languages', key: 'languages' },
  { label: 'Feedback depth', key: 'feedback' },
]

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, cancel anytime from your account settings with no penalty.',
  },
  {
    q: 'What happens to my progress if I downgrade?',
    a: 'Your past session history and feedback are always saved, regardless of your plan.',
  },
  {
    q: 'Do you offer student discounts?',
    a: 'We offer special bulk pricing for colleges - see our college partnerships page for details.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">

        {/* Hero */}
        <section className="py-14 px-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 mb-4">
            <Zap className="h-3 w-3" />
            Simple, honest pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Plans for every stage of your prep
          </h1>
          <p className="text-base text-gray-500 max-w-md mx-auto">
            Start free. Upgrade when you are ready. All plans include real AI feedback on every answer.
          </p>
        </section>

        {/* Desktop table */}
        <section className="hidden md:block max-w-6xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-4 gap-4 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-sm ${
                  plan.highlight
                    ? 'border-amber-400 shadow-lg scale-[1.04] z-10'
                    : 'border-gray-200'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5 mt-1">
                  <p className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-amber-600' : 'text-indigo-600'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-0.5">
                    <span className="text-sm font-medium text-gray-500 mb-0.5">Rs.</span>
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-gray-400 mb-0.5">{plan.period}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">{plan.desc}</p>
                </div>

                <div className="flex flex-col gap-3 mb-6 flex-1">
                  {ROWS.map((row) => (
                    <div key={row.key} className="flex items-start gap-2">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-amber-500' : 'text-indigo-400'}`} />
                      <div>
                        <p className="text-xs text-gray-400">{row.label}</p>
                        <p className="text-sm font-medium text-gray-800">{plan.features[row.key]}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href={plan.ctaHref}
                  className={`flex items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                    plan.highlight
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                      : 'border-2 border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Mobile stacked cards */}
        <section className="md:hidden flex flex-col gap-4 px-4 pb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-white p-5 shadow-sm ${
                plan.highlight ? 'border-amber-400 shadow-md' : 'border-gray-200'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-4 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold text-white">
                  Most Popular
                </span>
              )}

              <div className="flex items-start justify-between mb-4 mt-1">
                <div>
                  <p className={`text-sm font-semibold ${plan.highlight ? 'text-amber-600' : 'text-indigo-600'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-0.5 mt-0.5">
                    <span className="text-xs text-gray-500">Rs.</span>
                    <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-xs text-gray-400 mb-0.5">{plan.period}</span>}
                  </div>
                </div>
                <Link
                  href={plan.ctaHref}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>

              <div className="flex flex-col gap-2.5">
                {ROWS.map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 shrink-0">{row.label}</span>
                    <span className="text-xs font-medium text-gray-800 text-right">{plan.features[row.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto px-4 pb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Frequently asked questions</h2>
          <div className="rounded-2xl border border-gray-200 bg-white px-6 shadow-sm">
            <Accordion type="single" collapsible>
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
