'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light theme' : 'Dark luxury theme'}
      className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors
        text-gray-500 hover:text-gray-900 hover:bg-gray-100
        dark:text-neutral-400 dark:hover:text-amber-400 dark:hover:bg-neutral-800
        ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
}
