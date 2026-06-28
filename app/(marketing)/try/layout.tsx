import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Try a Free AI Interview Question — No Signup Needed',
  description:
    'Get a taste of CareerSetu. Answer one real AI-generated interview question and receive instant feedback — no account or credit card required.',
  alternates: { canonical: '/try' },
  openGraph: {
    title: 'Try CareerSetu Free — AI Interview Question, No Signup',
    description: 'Answer one AI interview question and get instant, honest feedback. No account needed.',
    url: '/try',
  },
}

export default function TryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
