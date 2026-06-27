'use client'

export interface RadarDatum {
  label: string
  value: number // 0..max
}

export default function RadarChart({ data, max = 10 }: { data: RadarDatum[]; max?: number }) {
  const size = 300
  const cx = size / 2
  const cy = size / 2
  const R = 92
  const n = data.length
  if (n < 3) return null

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const point = (i: number, r: number): [number, number] => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]

  const rings = [0.25, 0.5, 0.75, 1]
  const polygon = data
    .map((d, i) => point(i, R * (Math.max(0, Math.min(max, d.value)) / max)).join(','))
    .join(' ')

  const padX = 48
  return (
    <svg viewBox={`${-padX} 0 ${size + padX * 2} ${size}`} className="w-full max-w-[360px] mx-auto" role="img" aria-label="Competency radar chart">
      {/* grid rings */}
      {rings.map((rr, ri) => (
        <polygon
          key={ri}
          points={data.map((_, i) => point(i, R * rr).join(',')).join(' ')}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      ))}
      {/* axes */}
      {data.map((_, i) => {
        const [x, y] = point(i, R)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e5e7eb" strokeWidth={1} />
      })}
      {/* data polygon */}
      <polygon points={polygon} fill="rgba(79,70,229,0.18)" stroke="#4F46E5" strokeWidth={2} />
      {/* data points */}
      {data.map((d, i) => {
        const [x, y] = point(i, R * (Math.max(0, Math.min(max, d.value)) / max))
        return <circle key={i} cx={x} cy={y} r={3} fill="#4F46E5" />
      })}
      {/* labels */}
      {data.map((d, i) => {
        const [x, y] = point(i, R + 16)
        const c = Math.cos(angle(i))
        const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle'
        const words = d.label.split(' ')
        const lines = words.length > 1 && d.label.length > 12
          ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
          : [d.label]
        return (
          <text key={i} x={x} y={y - (lines.length - 1) * 6} textAnchor={anchor} className="fill-gray-600" fontSize={10}>
            {lines.map((ln, li) => (
              <tspan key={li} x={x} dy={li === 0 ? 0 : 11}>{ln}</tspan>
            ))}
            <tspan x={x} dy={11} className="fill-indigo-600" fontWeight={600}>{d.value}</tspan>
          </text>
        )
      })}
    </svg>
  )
}
