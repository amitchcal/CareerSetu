import Link from 'next/link'
import { Target, Mic, TrendingUp, Building2, Code2, Megaphone, Users } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

// ─── Data ─────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Target,
    title: 'Pick your role',
    description:
      'Choose the job you are preparing for — software engineer, bank PO, sales, or any other role.',
  },
  {
    step: '02',
    icon: Mic,
    title: 'Speak your answers, AI asks follow-ups',
    description:
      'Answer interview questions by speaking. Our AI listens and asks intelligent follow-up questions just like a real interviewer.',
  },
  {
    step: '03',
    icon: TrendingUp,
    title: 'Get structured feedback, practice again',
    description:
      'Receive honest, specific feedback on structure, clarity, and confidence — then go again until you are ready.',
  },
]

const ROLE_CARDS = [
  { icon: Building2, label: 'SSC / Bank PO Interview' },
  { icon: Code2, label: 'Software Engineer' },
  { icon: Megaphone, label: 'Sales & Marketing' },
  { icon: Users, label: 'General / Other' },
]

const WHY_CARDS = [
  {
    emoji: '🗣️',
    title: 'Hindi & English support',
    description:
      'Practice in the language you are most comfortable in. Switch between English and Hindi anytime.',
  },
  {
    emoji: '🎯',
    title: 'Honest, calibrated feedback — not empty praise',
    description:
      'Our AI gives you the real picture: what you did well and exactly what needs work, so you improve faster.',
  },
  {
    emoji: '💰',
    title: 'Affordable — a fraction of coaching costs',
    description:
      'Professional interview coaching costs thousands. CareerSetu gives you unlimited practice at a fraction of the price.',
  },
]

const FAQS = [
  {
    q: 'Is it really free to start?',
    a: 'Yes, you get 1 free mock interview per week with no credit card required.',
  },
  {
    q: 'How accurate is the AI feedback?',
    a: 'Our AI evaluates structure, clarity, and relevance using a consistent rubric — it\'s designed to give honest, specific feedback rather than generic praise, so you know exactly what to improve.',
  },
  {
    q: 'Which languages are supported?',
    a: 'English and Hindi, with more Indian languages coming soon.',
  },
  {
    q: 'Can I practice for government exam interviews?',
    a: 'Yes, including SSC, Bank PO, and other competitive exam interview rounds.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your subscription anytime from your account settings, no questions asked.',
  },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        {/* ── 1. Hero ───────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white">
          {/* subtle background gradient blob */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-indigo-50 opacity-60 blur-3xl"
          />

          <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36 text-center">
            <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-6">
              AI Mock Interviews for India
            </span>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl text-balance">
              Practice your interview with AI —{' '}
              <span className="text-indigo-600">in English or Hindi</span> —
              before the real thing.
            </h1>

            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto text-balance">
              Get honest, structured feedback so you walk into your real interview with confidence.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-amber-500 px-8 py-4 text-base font-semibold text-white shadow-md hover:bg-amber-600 active:scale-[0.98] transition-all"
              >
                Start Free Practice
              </Link>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-4 transition-colors"
              >
                See how it works
              </a>
            </div>
          </div>
        </section>

        {/* ── 2. Social proof strip ─────────────────────────────────────── */}
        <section className="bg-indigo-600 py-4 px-4">
          <p className="text-center text-sm font-medium text-indigo-100">
            Trusted by job seekers preparing for{' '}
            <span className="text-white font-semibold">SSC, Bank PO,</span> and{' '}
            <span className="text-white font-semibold">tech interviews</span> across India
          </p>
        </section>

        {/* ── 3. How it works ───────────────────────────────────────────── */}
        <section id="how-it-works" className="bg-gray-50 py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">How it works</h2>
              <p className="mt-3 text-gray-500">Three steps to interview-ready</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
                <div
                  key={step}
                  className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                      <Icon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <span className="text-4xl font-black text-gray-100 leading-none select-none">
                      {step}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
                    <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Role categories preview ────────────────────────────────── */}
        <section className="bg-white py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Practice for any role
              </h2>
              <p className="mt-3 text-gray-500">Pick the category that fits your goal</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {ROLE_CARDS.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                    <Icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                    {label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Why CareerSetu ─────────────────────────────────────────── */}
        <section className="bg-indigo-50 py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Why CareerSetu?</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {WHY_CARDS.map(({ emoji, title, description }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100"
                >
                  <span className="text-3xl">{emoji}</span>
                  <h3 className="mt-4 font-semibold text-gray-900 text-base">{title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. Pricing teaser ─────────────────────────────────────────── */}
        <section className="bg-white py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Simple, honest pricing
              </h2>
              <p className="mt-3 text-gray-500">No hidden fees. Cancel anytime.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Free plan */}
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">Free</p>
                  <p className="mt-1 text-4xl font-bold text-gray-900">₹0</p>
                  <p className="mt-1 text-sm text-gray-500">Forever free</p>
                </div>
                <ul className="flex flex-col gap-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    1 mock interview / week
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    AI feedback report
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Hindi &amp; English
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="mt-auto inline-flex items-center justify-center rounded-xl border-2 border-indigo-600 px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  Get started free
                </Link>
              </div>

              {/* Starter plan */}
              <div className="rounded-2xl border-2 border-indigo-600 bg-indigo-600 p-8 flex flex-col gap-4 shadow-lg">
                <div>
                  <span className="inline-block rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-amber-900 mb-2">
                    Most popular
                  </span>
                  <p className="text-sm font-semibold uppercase tracking-wider text-indigo-200">
                    Starter
                  </p>
                  <p className="mt-1 text-4xl font-bold text-white">₹199</p>
                  <p className="mt-1 text-sm text-indigo-200">per month</p>
                </div>
                <ul className="flex flex-col gap-2 text-sm text-indigo-100">
                  <li className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">✓</span>
                    Unlimited mock interviews
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">✓</span>
                    Detailed per-question feedback
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">✓</span>
                    Hindi &amp; English
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="mt-auto inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Start free trial
                </Link>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/pricing"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-4 transition-colors"
              >
                See full pricing →
              </Link>
            </div>
          </div>
        </section>

        {/* ── 7. FAQ ────────────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Frequently asked questions
              </h2>
            </div>

            <Accordion type="single" collapsible className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6">
              {FAQS.map(({ q, a }, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{q}</AccordionTrigger>
                  <AccordionContent>{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── 8. Final CTA banner ───────────────────────────────────────── */}
        <section className="bg-amber-500 py-16 px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl text-balance">
              Start your first mock interview free
            </h2>
            <p className="mt-4 text-amber-100 text-base">
              No credit card required. Get your first session in under 2 minutes.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-semibold text-amber-600 shadow-md hover:bg-amber-50 active:scale-[0.98] transition-all"
            >
              Start Free Practice
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
