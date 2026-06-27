'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Mic, ListChecks, Code2, ChevronRight } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'

interface PracticeMode {
  key: string
  title: string
  description: string
  icon: React.ReactNode
  href: string | null
  accent: string
  iconBg: string
}

const MODES: PracticeMode[] = [
  {
    key: 'interview',
    title: 'Mock interview',
    description: 'Voice-based AI interview with follow-ups and honest, structured feedback.',
    icon: <Mic className="h-5 w-5" />,
    href: '/interview/new',
    accent: 'border-indigo-200 hover:border-indigo-400',
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
  {
    key: 'mcq',
    title: 'MCQ test',
    description: 'Time-bound multiple-choice test, auto-graded with a topic-wise breakdown.',
    icon: <ListChecks className="h-5 w-5" />,
    href: '/test/new',
    accent: 'border-amber-200 hover:border-amber-400',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    key: 'coding',
    title: 'Coding assessment',
    description: 'Solve problems in an in-browser editor — write, run and get evaluated.',
    icon: <Code2 className="h-5 w-5" />,
    href: '/coding',
    accent: 'border-teal-200 hover:border-teal-400',
    iconBg: 'bg-teal-100 text-teal-600',
  },
]

export default function PracticePage() {
  return (
    <>
      <Navbar isLoggedIn />
      <main className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice</h1>
          <p className="mt-1 text-sm text-gray-500">Choose how you want to practise today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODES.map((mode) => {
            const isLive = mode.href !== null
            const card = (
              <div
                className={`flex h-full flex-col gap-4 rounded-2xl border-2 bg-white p-6 shadow-sm transition-all ${mode.accent} ${
                  isLive ? 'cursor-pointer active:scale-[0.99]' : 'opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${mode.iconBg}`}>
                    {mode.icon}
                  </div>
                  {!isLive && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                      Coming soon
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">{mode.title}</h2>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">{mode.description}</p>
                </div>
                {isLive && (
                  <div className="flex items-center gap-1 text-sm font-semibold text-indigo-600">
                    Start now
                    <ChevronRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            )

            return isLive ? (
              <Link key={mode.key} href={mode.href!} className="block h-full">
                {card}
              </Link>
            ) : (
              <div key={mode.key} className="h-full">{card}</div>
            )
          })}
        </div>
      </main>
    </>
  )
}
