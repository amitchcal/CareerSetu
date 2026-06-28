export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — illustration (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-indigo-600 items-center justify-center p-12 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-500 opacity-40" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-700 opacity-40" />

        <div className="relative z-10 max-w-md text-white">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-10">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14c-2.67 0-5.03-1.37-6.4-3.44.04-2.12 4.27-3.28 6.4-3.28s6.36 1.16 6.4 3.28C17.03 17.63 14.67 19 12 19z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">CareerSetu</span>
          </div>

          {/* Illustration */}
          <svg viewBox="0 0 380 280" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="w-full mb-8" aria-hidden="true">
            {/* Candidate card */}
            <rect x="20" y="20" width="155" height="240" rx="16" fill="white" fillOpacity="0.12" />
            {/* Avatar */}
            <circle cx="97" cy="80" r="36" fill="white" fillOpacity="0.2" />
            <circle cx="97" cy="68" r="18" fill="white" fillOpacity="0.6" />
            <ellipse cx="97" cy="102" rx="22" ry="14" fill="white" fillOpacity="0.4" />
            {/* Mic icon */}
            <rect x="85" y="130" width="24" height="36" rx="12" fill="#F59E0B" />
            <path d="M78 152 Q78 170 97 170 Q116 170 116 152" stroke="#F59E0B" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <line x1="97" y1="170" x2="97" y2="180" stroke="#F59E0B" strokeWidth="3"/>
            {/* Label */}
            <rect x="50" y="195" width="94" height="10" rx="5" fill="white" fillOpacity="0.3" />
            <rect x="65" y="212" width="64" height="8" rx="4" fill="white" fillOpacity="0.2" />
            <rect x="72" y="227" width="50" height="8" rx="4" fill="white" fillOpacity="0.2" />

            {/* Arrow */}
            <path d="M180 140 L200 140" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="4 3"/>
            <polygon points="196,135 208,140 196,145" fill="white" fillOpacity="0.5"/>

            {/* AI response card */}
            <rect x="205" y="20" width="155" height="240" rx="16" fill="white" fillOpacity="0.12" />
            {/* AI face */}
            <circle cx="282" cy="80" r="36" fill="white" fillOpacity="0.2" />
            <circle cx="270" cy="72" r="6" fill="#F59E0B" />
            <circle cx="294" cy="72" r="6" fill="#F59E0B" />
            <path d="M270 92 Q282 102 294 92" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <rect x="265" y="105" width="34" height="14" rx="7" fill="#F59E0B" />
            <text x="282" y="116" textAnchor="middle" fontSize="8" fill="white" fontFamily="sans-serif" fontWeight="bold">AI</text>
            {/* Feedback lines */}
            <rect x="228" y="140" width="108" height="9" rx="4" fill="white" fillOpacity="0.4" />
            <rect x="228" y="156" width="88" height="9" rx="4" fill="white" fillOpacity="0.3" />
            <rect x="228" y="172" width="100" height="9" rx="4" fill="white" fillOpacity="0.3" />
            {/* Score */}
            <rect x="247" y="195" width="70" height="28" rx="14" fill="#F59E0B" />
            <text x="282" y="214" textAnchor="middle" fontSize="13" fill="white" fontFamily="sans-serif" fontWeight="bold">Score: 8/10</text>
          </svg>

          <h2 className="text-2xl font-bold mb-3 text-balance">
            Practice interviews. Build confidence.
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed">
            Join thousands of Indian job seekers who practice with AI to ace their real interviews — in English or Hindi, for any role.
          </p>

          {/* Testimonial chip */}
          <div className="mt-8 bg-white/10 rounded-xl p-4 border border-white/20">
            <p className="text-sm text-indigo-100 italic leading-relaxed">
              &ldquo;The AI feedback was brutally honest — exactly what I needed before my Bank PO interview.&rdquo;
            </p>
            <p className="mt-2 text-xs text-indigo-300 font-medium">— Priya S., cleared Bank PO 2024</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
