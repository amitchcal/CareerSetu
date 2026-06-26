'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface RoleOption {
  value: string
  label: string
}

export const DEFAULT_ROLES: RoleOption[] = [
  { value: 'swe_fresher', label: 'Software Engineer - Fresher' },
  { value: 'swe_experienced', label: 'Software Engineer - Experienced' },
  { value: 'ssc_bank', label: 'SSC CGL / Bank PO Interview' },
  { value: 'sales', label: 'Sales Executive' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
]

interface RoleSelectProps {
  value: string
  onChange: (value: string, label: string) => void
  options?: RoleOption[]
  placeholder?: string
  error?: string
}

export default function RoleSelect({
  value,
  onChange,
  options = DEFAULT_ROLES,
  placeholder = 'Search or select a role…',
  error,
}: RoleSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function handleOpen() {
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleSelect(opt: RoleOption) {
    onChange(opt.value, opt.label)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={open ? () => { setOpen(false); setQuery('') } : handleOpen}
        className={`flex w-full items-center justify-between rounded-xl border-2 px-3.5 py-3 text-sm transition-all ${
          error
            ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-100'
            : open
            ? 'border-indigo-500 ring-2 ring-indigo-100'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* Search */}
          <div className="border-b border-gray-100 p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search…"
              className="w-full rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-gray-50"
            />
          </div>

          {/* Options */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-2.5 text-sm text-gray-400">No results</li>
            ) : (
              filtered.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    <Check
                      className={`h-3.5 w-3.5 shrink-0 ${
                        value === opt.value ? 'text-indigo-600' : 'text-transparent'
                      }`}
                    />
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
