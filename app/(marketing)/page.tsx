import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Target, Mic, TrendingUp, Building2, Code2, Megaphone, Users } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import HeroIllustration from '@/components/shared/HeroIllustration'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'AI Mock Interview Practice — Free to Start',
  description:
    'Practice mock interviews in English or Hindi with AI. Get honest feedback for SSC, Bank PO, software engineer, and sales roles. 1 free session per week — no credit card needed.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'CareerSetu — AI Mock Interview Practice for India',
    description:
      'Practice mock interviews with AI in English or Hindi. Honest, calibrated feedback for SSC, Bank PO, tech, and more. Free to start.',
    url: '/',
  },
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://careersetu.in'

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CareerSetu',
  url: BASE_URL,
  logo: `${BASE_URL}/icon.svg`,
  sameAs: [
    'https://www.linkedin.com/company/careersetu',
    'https://github.com/careersetu',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@careersetu.in',
    contactType: 'customer support',
    availableLanguage: ['English', 'Hindi'],
  },
}

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'CareerSetu',
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/try?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

const jsonLdSoftwareApp = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CareerSetu',
  operatingSystem: 'Web',
  applicationCategory: 'EducationApplication',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'INR',
      description: '1 mock interview per week',
    },
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '199',
      priceCurrency: 'INR',
      description: 'Unlimited mock interviews with detailed feedback',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '499',
      priceCurrency: 'INR',
      description: 'Unlimited interviews, all roles, Hinglish support',
    },
  ],
  description:
    'AI-powered mock interview practice for Indian job seekers. Practice in English or Hindi for SSC, Bank PO, software engineer, and other roles.',
  inLanguage: ['en', 'hi'],
}

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
  const jsonLdFAQ = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <>
      <Script
        id="ld-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
      />
      <Script
        id="ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
      />
      <Script
        id="ld-software-app"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftwareApp) }}
      />
      <Script
        id="ld-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
      />
      <Navbar />

      <main>
        {/* ── 1. Hero ───────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-indigo-50 opacity-70 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[400px] rounded-full bg-amber-50 opacity-50 blur-3xl"
          />

          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              {/* Left — copy */}
              <div>
                <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-6">
                  AI Mock Interviews for India
                </span>

                <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem] text-balance">
                  Practice your interview with AI —{' '}
                  <span className="text-indigo-600">in English or Hindi</span> —
                  before the real thing.
                </h1>

                <p className="mt-6 text-lg text-gray-600 text-balance">
                  Get honest, structured feedback so you walk into your real interview with confidence.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                  <Link
                    href="/try"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-amber-500 px-8 py-4 text-base font-semibold text-white shadow-md hover:bg-amber-600 active:scale-[0.98] transition-all"
                  >
                    Try a question — no signup
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-4 transition-colors py-4"
                  >
                    Or start free
                  </Link>
                </div>

                {/* Trust signals */}
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="text-green-500 font-bold">✓</span> No credit card needed</span>
                  <span className="flex items-center gap-1.5"><span className="text-green-500 font-bold">✓</span> Hindi & English</span>
                  <span className="flex items-center gap-1.5"><span className="text-green-500 font-bold">✓</span> Instant AI feedback</span>
                </div>
              </div>

              {/* Right — illustration */}
              <div className="flex items-center justify-center">
                <HeroIllustration className="w-full max-w-[480px] drop-shadow-xl" />
              </div>
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
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              {/* Left — process illustration */}
              <div className="flex items-center justify-center order-2 lg:order-1">
                <svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg"
                  className="w-full max-w-sm drop-shadow-lg" aria-hidden="true">
                  {/* Background */}
                  <rect x="10" y="10" width="380" height="340" rx="20" fill="#F8FAFF" />

                  {/* Step 1 — Role card */}
                  <rect x="30" y="30" width="340" height="80" rx="14" fill="white" stroke="#E0E7FF" strokeWidth="2" />
                  <circle cx="62" cy="70" r="20" fill="#EEF2FF" />
                  <text x="62" y="75" textAnchor="middle" fontSize="16" fontFamily="sans-serif">🎯</text>
                  <rect x="92" y="52" width="130" height="10" rx="5" fill="#C7D2FE" />
                  <rect x="92" y="68" width="200" height="8" rx="4" fill="#E0E7FF" />
                  <rect x="92" y="82" width="160" height="8" rx="4" fill="#E0E7FF" />
                  <rect x="290" y="57" width="60" height="26" rx="8" fill="#4F46E5" />
                  <text x="320" y="75" textAnchor="middle" fontSize="10" fill="white" fontFamily="sans-serif" fontWeight="bold">Pick role</text>

                  {/* Arrow */}
                  <line x1="200" y1="114" x2="200" y2="138" stroke="#C7D2FE" strokeWidth="2" strokeDasharray="4 3" />
                  <polygon points="194,136 200,148 206,136" fill="#A5B4FC" />

                  {/* Step 2 — Mic / speaking */}
                  <rect x="30" y="150" width="340" height="80" rx="14" fill="white" stroke="#E0E7FF" strokeWidth="2" />
                  <circle cx="62" cy="190" r="20" fill="#FEF3C7" />
                  <text x="62" y="196" textAnchor="middle" fontSize="16" fontFamily="sans-serif">🎤</text>
                  <rect x="92" y="172" width="110" height="10" rx="5" fill="#FDE68A" />
                  <rect x="92" y="188" width="200" height="8" rx="4" fill="#FEF3C7" />
                  <rect x="92" y="202" width="150" height="8" rx="4" fill="#FEF3C7" />
                  {/* Sound wave bars */}
                  <rect x="294" y="176" width="6" height="28" rx="3" fill="#F59E0B" opacity="0.5" />
                  <rect x="304" y="168" width="6" height="44" rx="3" fill="#F59E0B" />
                  <rect x="314" y="180" width="6" height="20" rx="3" fill="#F59E0B" opacity="0.7" />
                  <rect x="324" y="172" width="6" height="36" rx="3" fill="#F59E0B" opacity="0.9" />
                  <rect x="334" y="184" width="6" height="12" rx="3" fill="#F59E0B" opacity="0.4" />

                  {/* Arrow */}
                  <line x1="200" y1="234" x2="200" y2="258" stroke="#C7D2FE" strokeWidth="2" strokeDasharray="4 3" />
                  <polygon points="194,256 200,268 206,256" fill="#A5B4FC" />

                  {/* Step 3 — Feedback */}
                  <rect x="30" y="270" width="340" height="68" rx="14" fill="white" stroke="#BBF7D0" strokeWidth="2" />
                  <circle cx="62" cy="304" r="20" fill="#D1FAE5" />
                  <text x="62" y="310" textAnchor="middle" fontSize="16" fontFamily="sans-serif">📊</text>
                  <rect x="92" y="288" width="100" height="10" rx="5" fill="#6EE7B7" />
                  <rect x="92" y="304" width="180" height="8" rx="4" fill="#D1FAE5" />
                  <rect x="92" y="318" width="140" height="8" rx="4" fill="#D1FAE5" />
                  {/* Score pill */}
                  <rect x="290" y="291" width="62" height="26" rx="13" fill="#10B981" />
                  <text x="321" y="309" textAnchor="middle" fontSize="12" fill="white" fontFamily="sans-serif" fontWeight="bold">8 / 10</text>
                </svg>
              </div>

              {/* Right — cards */}
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-2">How it works</h2>
                <p className="text-gray-500 mb-8">Three steps to interview-ready</p>

                <div className="flex flex-col gap-5">
                  {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
                    <div
                      key={step}
                      className="relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                        <Icon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
                          <span className="text-2xl font-black text-gray-100 leading-none select-none">{step}</span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                <Link
                  key={label}
                  href="/signup"
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                    <Icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                    {label}
                  </span>
                </Link>
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

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Free plan */}
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-7 flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">Free</p>
                  <p className="mt-1 text-4xl font-bold text-gray-900">₹0</p>
                  <p className="mt-1 text-sm text-gray-500">Forever free</p>
                </div>
                <ul className="flex flex-col gap-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>1 mock interview / week</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>AI feedback report</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>Hindi &amp; English</li>
                </ul>
                <Link href="/signup" className="mt-auto inline-flex items-center justify-center rounded-xl border-2 border-indigo-600 px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                  Get started free
                </Link>
              </div>

              {/* Starter plan */}
              <div className="relative rounded-2xl border-2 border-amber-400 bg-white p-7 flex flex-col gap-4 shadow-lg">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">Most Popular</span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Starter</p>
                  <p className="mt-1 text-4xl font-bold text-gray-900">₹199</p>
                  <p className="mt-1 text-sm text-gray-500">per month</p>
                </div>
                <ul className="flex flex-col gap-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="text-indigo-500 font-bold">✓</span>Unlimited mock interviews</li>
                  <li className="flex items-center gap-2"><span className="text-indigo-500 font-bold">✓</span>Detailed per-question feedback</li>
                  <li className="flex items-center gap-2"><span className="text-indigo-500 font-bold">✓</span>Hindi &amp; English</li>
                </ul>
                <Link href="/signup" className="mt-auto inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm">
                  Start free trial
                </Link>
              </div>

              {/* Pro plan */}
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-7 flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">Pro</p>
                  <p className="mt-1 text-4xl font-bold text-gray-900">₹499</p>
                  <p className="mt-1 text-sm text-gray-500">per month</p>
                </div>
                <ul className="flex flex-col gap-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>Unlimited interviews</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>All role categories</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>English, Hindi &amp; Hinglish</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span>Company-style simulation</li>
                </ul>
                <Link href="/signup" className="mt-auto inline-flex items-center justify-center rounded-xl border-2 border-indigo-600 px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                  Get Pro
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
