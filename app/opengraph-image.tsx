import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CareerSetu — AI Mock Interview Practice for India'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #6366f1 50%, #818cf8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Badge */}
        <div
          style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '100px',
            padding: '8px 24px',
            color: '#e0e7ff',
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '32px',
          }}
        >
          AI Mock Interviews for India
        </div>

        {/* Headline */}
        <div
          style={{
            color: '#ffffff',
            fontSize: '64px',
            fontWeight: 800,
            textAlign: 'center',
            lineHeight: 1.1,
            maxWidth: '900px',
            marginBottom: '24px',
          }}
        >
          CareerSetu
        </div>

        <div
          style={{
            color: '#c7d2fe',
            fontSize: '28px',
            fontWeight: 400,
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
            marginBottom: '48px',
          }}
        >
          Practice interviews in English or Hindi.
          Honest AI feedback for SSC, Bank PO, tech & more.
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {['Free to start', 'Hindi & English', 'Honest feedback'].map((label) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '100px',
                padding: '10px 24px',
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '20px',
          }}
        >
          careersetu.in
        </div>
      </div>
    ),
    { ...size }
  )
}
