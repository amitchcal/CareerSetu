import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'

const footerLinks = {
  Product: [
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: 'mailto:support@careersetu.in' },
  ],
  Legal: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ],
}

const socialLinks = [
  { label: 'LinkedIn', href: 'https://linkedin.com/company/careersetu' },
  { label: 'GitHub', href: 'https://github.com/amitchcal/CareerSetu' },
]

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-neutral-800 dark:bg-[#0d0e11]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.svg" alt="CareerSetu" width={36} height={36} className="rounded-lg" />
              <span className="text-xl font-bold text-gray-900 dark:bg-gradient-to-r dark:from-amber-200 dark:via-yellow-400 dark:to-amber-500 dark:bg-clip-text dark:text-transparent">CareerSetu</span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs">
              AI-powered mock interview practice for Indian job seekers. Practice, get feedback, and land your dream job.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 items-center justify-center rounded-lg border border-gray-200 px-3 text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors dark:border-neutral-800 dark:text-neutral-500 dark:hover:border-amber-500/40 dark:hover:text-amber-400"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-300 mb-3">{heading}</h3>
              <ul className="flex flex-col gap-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-gray-500 hover:text-indigo-600 transition-colors dark:text-neutral-500 dark:hover:text-amber-400"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-200 dark:border-neutral-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            &copy; 2026 Vividha Consultancy. All rights reserved.
          </p>
          <p className="text-sm text-gray-400">
            Built with{' '}
            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-600 transition-colors dark:text-amber-500 dark:hover:text-amber-400"
            >
              Claude
            </a>{' '}
            for Indian job seekers.
          </p>
        </div>
      </div>
    </footer>
  )
}
