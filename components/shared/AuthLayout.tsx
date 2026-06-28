import Link from 'next/link'
import Image from 'next/image'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12 dark:bg-[#0b0c0e]">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Image src="/logo.svg" alt="CareerSetu" width={36} height={36} className="rounded-lg" />
        <span className="text-2xl font-bold text-gray-900 dark:bg-gradient-to-r dark:from-amber-200 dark:via-yellow-400 dark:to-amber-500 dark:bg-clip-text dark:text-transparent">CareerSetu</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 dark:bg-[#16171a] dark:border-neutral-800">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
