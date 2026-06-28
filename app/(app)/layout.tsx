import Link from 'next/link'

function AppFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto dark:border-neutral-800 dark:bg-[#0d0e11]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="CareerSetu" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-semibold text-gray-700 dark:text-amber-400">CareerSetu</span>
          </Link>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms</Link>
            <Link href="mailto:support@careersetu.in" className="hover:text-indigo-600 transition-colors">Support</Link>
            <span>© 2026 CareerSetu</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-[#0b0c0e]">
      {children}
      <AppFooter />
    </div>
  )
}
