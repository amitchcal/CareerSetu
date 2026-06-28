'use client'

export interface LinePoint {
  label: string
  value: number // 0..max
}

export default function LineChart({ data, max = 10 }: { data: LinePoint[]; max?: number }) {
  if (data.length === 0) return null
  const w = 320, h = 150, padL = 22, padR = 12, padT = 12, padB = 26
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const n = data.length
  const x = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v: number) => padT + innerH * (1 - Math.max(0, Math.min(max, v)) / max)
  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ')
  const gridVals = [0, max / 2, max]
  const showEvery = Math.ceil(n / 6)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Score trend over time">
      {gridVals.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={y(g)} x2={w - padR} y2={y(g)} stroke="#f1f5f9" strokeWidth={1} />
          <text x={padL - 6} y={y(g) + 3} textAnchor="end" fontSize={9} className="fill-gray-400">{g}</text>
        </g>
      ))}
      {n > 1 && <polyline points={linePts} fill="none" stroke="#4F46E5" strokeWidth={2} strokeLinejoin="round" />}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r={3} fill="#4F46E5" />
          {(i % showEvery === 0 || i === n - 1) && (
            <text x={x(i)} y={h - 8} textAnchor="middle" fontSize={9} className="fill-gray-400">{d.label}</text>
          )}
        </g>
      ))}
    </svg>
  )
}
