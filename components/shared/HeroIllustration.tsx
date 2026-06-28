export default function HeroIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background card */}
      <rect x="30" y="20" width="420" height="360" rx="24" fill="#EEF2FF" />

      {/* Desk */}
      <rect x="60" y="290" width="360" height="16" rx="8" fill="#C7D2FE" />
      <rect x="100" y="306" width="20" height="50" rx="4" fill="#A5B4FC" />
      <rect x="360" y="306" width="20" height="50" rx="4" fill="#A5B4FC" />

      {/* Laptop screen */}
      <rect x="130" y="170" width="220" height="140" rx="12" fill="white" stroke="#818CF8" strokeWidth="3" />
      <rect x="130" y="290" width="220" height="10" rx="4" fill="#C7D2FE" />
      <rect x="195" y="300" width="90" height="8" rx="4" fill="#A5B4FC" />

      {/* Laptop screen content — AI face */}
      <circle cx="240" cy="218" r="28" fill="#EEF2FF" />
      <circle cx="230" cy="212" r="5" fill="#4F46E5" />
      <circle cx="250" cy="212" r="5" fill="#4F46E5" />
      <path d="M228 226 Q240 234 252 226" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* AI badge */}
      <rect x="218" y="250" width="44" height="18" rx="9" fill="#4F46E5" />
      <text x="240" y="263" textAnchor="middle" fontSize="9" fill="white" fontFamily="sans-serif" fontWeight="bold">AI</text>

      {/* Sound waves from laptop */}
      <path d="M290 218 Q300 210 300 218 Q300 226 290 218" stroke="#818CF8" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M296 218 Q312 206 312 218 Q312 230 296 218" stroke="#818CF8" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Person (candidate) */}
      {/* Body */}
      <rect x="195" y="110" width="90" height="70" rx="20" fill="#FDE68A" />
      {/* Shirt */}
      <rect x="188" y="150" width="104" height="40" rx="8" fill="#4F46E5" />
      {/* Head */}
      <circle cx="240" cy="90" r="36" fill="#FDE68A" />
      {/* Hair */}
      <ellipse cx="240" cy="58" rx="28" ry="14" fill="#78350F" />
      <rect x="212" y="58" width="56" height="20" rx="0" fill="#78350F" />
      {/* Eyes */}
      <circle cx="228" cy="88" r="4" fill="#1E1B4B" />
      <circle cx="252" cy="88" r="4" fill="#1E1B4B" />
      {/* Smile */}
      <path d="M228 104 Q240 114 252 104" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Microphone in hand */}
      <rect x="268" y="140" width="14" height="26" rx="7" fill="#374151" />
      <rect x="264" y="160" width="22" height="6" rx="3" fill="#6B7280" />
      <rect x="273" y="166" width="4" height="12" rx="2" fill="#6B7280" />
      {/* Mic grill lines */}
      <line x1="268" y1="148" x2="282" y2="148" stroke="#6B7280" strokeWidth="1" />
      <line x1="268" y1="154" x2="282" y2="154" stroke="#6B7280" strokeWidth="1" />

      {/* Speech bubble from person */}
      <rect x="295" y="62" width="120" height="52" rx="12" fill="white" stroke="#C7D2FE" strokeWidth="2" />
      <polygon points="295,92 280,100 297,102" fill="white" stroke="#C7D2FE" strokeWidth="2" />
      <rect x="305" y="74" width="100" height="8" rx="4" fill="#C7D2FE" />
      <rect x="305" y="88" width="80" height="8" rx="4" fill="#E0E7FF" />
      <rect x="305" y="102" width="90" height="8" rx="4" fill="#E0E7FF" />

      {/* Feedback badge floating top-left */}
      <rect x="42" y="48" width="130" height="68" rx="12" fill="white" stroke="#FCD34D" strokeWidth="2" shadow-md="true" />
      <text x="57" y="72" fontSize="11" fill="#92400E" fontFamily="sans-serif" fontWeight="bold">Feedback</text>
      <rect x="57" y="80" width="90" height="7" rx="3" fill="#FDE68A" />
      <rect x="57" y="92" width="70" height="7" rx="3" fill="#FDE68A" />
      <rect x="57" y="104" width="80" height="7" rx="3" fill="#FEF3C7" />
      {/* Score badge */}
      <circle cx="152" cy="58" r="18" fill="#F59E0B" />
      <text x="152" y="63" textAnchor="middle" fontSize="13" fill="white" fontFamily="sans-serif" fontWeight="bold">8/10</text>

      {/* Stars row */}
      <text x="57" y="130" fontSize="13" fill="#F59E0B" fontFamily="sans-serif">★ ★ ★ ★ ☆</text>
    </svg>
  )
}
