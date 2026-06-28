// Code execution via Wandbox (free public API, no key required).
// (The public Piston API became whitelist-only in Feb 2026, so Wandbox is used
// instead — same "no setup" property. Swap this file to self-host later.)

export const CODE_LANGUAGES: Record<string, { compiler: string; label: string }> = {
  python: { compiler: 'cpython-3.10.15', label: 'Python' },
  javascript: { compiler: 'nodejs-20.17.0', label: 'JavaScript' },
}

export interface RunResult {
  stdout: string
  stderr: string
  code: number | null
  timedOut: boolean
}

export async function runCode(langKey: string, sourceCode: string, stdin: string): Promise<RunResult> {
  const cfg = CODE_LANGUAGES[langKey]
  if (!cfg) throw new Error(`Unsupported language: ${langKey}`)

  const res = await fetch('https://wandbox.org/api/compile.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ compiler: cfg.compiler, code: sourceCode, stdin }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Runner error ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  return {
    stdout: data.program_output ?? '',
    stderr: data.program_error || data.compiler_error || '',
    code: data.status != null ? Number(data.status) : null,
    timedOut: !!data.signal,
  }
}
