import Link from 'next/link'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-6">
          About
        </span>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Built for Indian job seekers</h1>
        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          CareerSetu was built because quality interview preparation in India is expensive, inaccessible, or generic. Coaching centres charge thousands of rupees. Most online tools are built for Western job markets, in English only, with no context for SSC, Bank PO, or campus placements.
        </p>
        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          We built CareerSetu to change that — a practice partner that speaks your language (literally), understands the Indian interview format, and gives you honest, actionable feedback at a fraction of coaching costs.
        </p>
        <p className="text-lg text-gray-600 mb-10 leading-relaxed">
          Whether you are a fresher preparing for your first campus interview, a professional switching roles, or a government exam aspirant — CareerSetu meets you where you are.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            { stat: '₹0', label: 'to start — no credit card' },
            { stat: '3 languages', label: 'English, Hindi, Hinglish' },
            { stat: 'Honest AI', label: 'no generic praise' },
          ].map(({ stat, label }) => (
            <div key={label} className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-2xl font-extrabold text-indigo-600 mb-1">{stat}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-indigo-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-gray-900 mb-1">Questions or feedback?</p>
            <p className="text-sm text-gray-600">We read every message. Reach us at <a href="mailto:support@careersetu.in" className="text-indigo-600 hover:underline">support@careersetu.in</a></p>
          </div>
          <Link href="/signup" className="shrink-0 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors">
            Start practising free
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
