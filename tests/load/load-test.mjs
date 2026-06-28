/**
 * CareerSetu — Load & Performance Test Runner
 * Uses autocannon for HTTP load and collects latency/throughput metrics.
 * Simulates ramp-up from 50 → 500 → 2000 → 5000 → 10000 VUs against key routes.
 */
import autocannon from 'autocannon'

const BASE = 'http://localhost:3000'

const ROUTES = [
  { name: 'Landing page',   path: '/' },
  { name: 'Pricing page',   path: '/pricing' },
  { name: 'About page',     path: '/about' },
  { name: 'Privacy page',   path: '/privacy' },
  { name: 'Terms page',     path: '/terms' },
  { name: 'Login page',     path: '/login' },
  { name: 'Try/Demo page',  path: '/try' },
  { name: 'API: tickets GET (no auth)', path: '/api/tickets' },
]

// Ramp stages: [connections, duration(s), label]
const RAMP = [
  [50,   10, '50 VU  (baseline)'],
  [200,  10, '200 VU (warm)'],
  [500,  10, '500 VU (moderate)'],
  [1000, 10, '1 000 VU'],
  [2000, 10, '2 000 VU'],
  [5000,  8, '5 000 VU'],
  [10000, 5, '10 000 VU (peak)'],
]

const THRESHOLDS = {
  p99LatencyMs: 2000,   // 99th percentile < 2s
  p95LatencyMs: 1000,   // 95th percentile < 1s
  errorRatePct: 1,      // <1% errors
}

function colorize(val, threshold, unit = 'ms', invert = false) {
  const pass = invert ? val < threshold : val <= threshold
  const red = '\x1b[31m', green = '\x1b[32m', yellow = '\x1b[33m', reset = '\x1b[0m'
  const color = pass ? green : red
  return `${color}${val}${unit}${reset}`
}

async function runStage(path, connections, duration) {
  return new Promise((resolve) => {
    const inst = autocannon({
      url: `${BASE}${path}`,
      connections,
      duration,
      pipelining: 1,
      timeout: 10,
    }, (err, result) => {
      if (err) resolve(null)
      else resolve(result)
    })
    autocannon.track(inst, { renderProgressBar: false })
  })
}

function fmtLatency(n) {
  return n == null ? '—' : `${n}ms`
}

async function testRoute(route) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`  📄 ${route.name}  →  ${route.path}`)
  console.log('═'.repeat(70))
  console.log(
    `${'Stage'.padEnd(22)} ${'VU'.padStart(6)} ${'RPS'.padStart(8)} ${'p50'.padStart(8)} ${'p95'.padStart(8)} ${'p99'.padStart(8)} ${'Errors'.padStart(8)} ${'Timeout'.padStart(8)}`
  )
  console.log('─'.repeat(70))

  const results = []
  for (const [connections, duration, label] of RAMP) {
    const r = await runStage(route.path, connections, duration)
    if (!r) { console.log(`${label.padEnd(22)} ERROR`); continue }

    const rps    = Math.round(r.requests.average)
    const p50    = r.latency.p50
    const p95    = r.latency.p95
    const p99    = r.latency.p99
    const errors = r.errors + r.timeouts
    const errPct = r.requests.total > 0 ? ((errors / r.requests.total) * 100).toFixed(1) : '0.0'
    const timeouts = r.timeouts

    const p95c = colorize(p95, THRESHOLDS.p95LatencyMs)
    const p99c = colorize(p99, THRESHOLDS.p99LatencyMs)
    const errc = colorize(parseFloat(errPct), THRESHOLDS.errorRatePct, '%')

    console.log(
      `${label.padEnd(22)} ${String(connections).padStart(6)} ${String(rps).padStart(8)} ${fmtLatency(p50).padStart(8)} ${p95c.padStart(8)} ${p99c.padStart(8)} ${errc.padStart(8)} ${String(timeouts).padStart(8)}`
    )

    results.push({ label, connections, rps, p50, p95, p99, errors, errPct: parseFloat(errPct), timeouts })
  }

  // Find bottleneck: first stage where p99 > threshold or errors > threshold
  const bottleneck = results.find(r =>
    r.p99 > THRESHOLDS.p99LatencyMs || r.errPct > THRESHOLDS.errorRatePct
  )

  if (bottleneck) {
    console.log(`\n  ⚠️  Bottleneck detected at ${bottleneck.label}: p99=${bottleneck.p99}ms, errors=${bottleneck.errPct}%`)
  } else {
    console.log(`\n  ✅ No bottleneck — all stages within thresholds`)
  }

  return { route: route.name, path: route.path, results, bottleneck }
}

async function main() {
  console.log('\n\x1b[1m╔══════════════════════════════════════════════════════════════════════╗\x1b[0m')
  console.log('\x1b[1m║          CareerSetu — Load & Performance Test                        ║\x1b[0m')
  console.log('\x1b[1m║  Target: http://localhost:3000   Max VU: 10 000                      ║\x1b[0m')
  console.log('\x1b[1m╚══════════════════════════════════════════════════════════════════════╝\x1b[0m')
  console.log(`\nThresholds:  p95 < ${THRESHOLDS.p95LatencyMs}ms  |  p99 < ${THRESHOLDS.p99LatencyMs}ms  |  errors < ${THRESHOLDS.errorRatePct}%`)
  console.log('\x1b[33mNOTE: 10 000 concurrent connections from one machine will saturate\x1b[0m')
  console.log('\x1b[33mthe local TCP stack. Results > ~2 000 VU reflect single-machine limits,\x1b[0m')
  console.log('\x1b[33mnot just app limits. Use a cloud load generator for production targets.\x1b[0m\n')

  const allResults = []
  for (const route of ROUTES) {
    const r = await testRoute(route)
    allResults.push(r)
  }

  // Summary table
  console.log('\n\n' + '═'.repeat(70))
  console.log('  SUMMARY — Performance at 10 000 VU (peak stage)')
  console.log('═'.repeat(70))
  console.log(`${'Page'.padEnd(30)} ${'RPS'.padStart(8)} ${'p95'.padStart(8)} ${'p99'.padStart(8)} ${'Err%'.padStart(8)} ${'Status'.padStart(10)}`)
  console.log('─'.repeat(70))

  for (const { route, path, results, bottleneck } of allResults) {
    const peak = results[results.length - 1]
    if (!peak) continue
    const status = bottleneck ? `\x1b[31m⚠ @${bottleneck.connections}VU\x1b[0m` : '\x1b[32m✅ PASS\x1b[0m'
    console.log(
      `${(route).padEnd(30)} ${String(peak.rps).padStart(8)} ${fmtLatency(peak.p95).padStart(8)} ${fmtLatency(peak.p99).padStart(8)} ${String(peak.errPct).padStart(7)}% ${status.padStart(10)}`
    )
    void path
  }

  console.log('\n')
}

main().catch(console.error)
