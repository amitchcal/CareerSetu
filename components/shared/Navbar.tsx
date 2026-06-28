'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronDown, User, CreditCard, LogOut, LayoutDashboard, Dumbbell, Library, BarChart3, FileText } from 'lucide-react'
import ThemeToggle from '@/components/shared/ThemeToggle'
import IssueButton from '@/components/shared/IssueButton'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { supabase } from '@/lib/supabase'

interface NavbarProps {
  isLoggedIn?: boolean
  user?: {
    name?: string
    email?: string
    avatarUrl?: string
  }
}

export default function Navbar({ isLoggedIn = false, user: userProp }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState(userProp)

  useEffect(() => {
    if (userProp) { setUser(userProp); return }
    if (!isLoggedIn) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      setUser({
        name: session.user.user_metadata?.full_name ?? undefined,
        email: session.user.email ?? undefined,
        avatarUrl: session.user.user_metadata?.avatar_url ?? undefined,
      })
    })
  }, [isLoggedIn, userProp])

  const navLinks = isLoggedIn
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: '/practice', label: 'Practice', icon: <Dumbbell className="h-4 w-4" /> },
        { href: '/question-bank', label: 'Question bank', icon: <Library className="h-4 w-4" /> },
        { href: '/reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> },
        { href: '/resume-builder', label: 'Resume', icon: <FileText className="h-4 w-4" /> },
      ]
    : [
        { href: '/#how-it-works', label: 'How it works' },
        { href: '/pricing', label: 'Pricing' },
      ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-[#0d0e11]/90 dark:supports-[backdrop-filter]:bg-[#0d0e11]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="CareerSetu" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold text-gray-900 dark:bg-gradient-to-r dark:from-amber-200 dark:via-yellow-400 dark:to-amber-500 dark:bg-clip-text dark:text-transparent">CareerSetu</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors dark:text-neutral-400 dark:hover:text-amber-400"
              >
                {'icon' in link && link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <IssueButton />
            <ThemeToggle />
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                    {user?.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.name ?? 'User'}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold">
                        {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                    )}
                    <span className="max-w-[120px] truncate">{user?.name ?? user?.email ?? 'Account'}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/subscription" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Subscription
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/auth/logout" className="flex items-center gap-2 text-red-600">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-gray-600 hover:text-indigo-600">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm">
                  <Link href="/signup">Start Free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button
                aria-label="Toggle menu"
                className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 dark:bg-[#16171a] dark:border-neutral-800">
              <div className="flex flex-col gap-6 pt-6">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <Image src="/logo.svg" alt="CareerSetu" width={36} height={36} className="rounded-lg" />
                  <span className="text-xl font-bold text-gray-900">CareerSetu</span>
                </Link>

                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      {'icon' in link && link.icon}
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="border-t border-gray-200 dark:border-neutral-800 pt-4">
                  <IssueButton />
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 dark:border-neutral-800 pt-4">
                  <span className="text-xs text-gray-400 dark:text-neutral-500">Theme</span>
                  <ThemeToggle />
                </div>

                <div className="flex flex-col gap-3">
                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        href="/subscription"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <CreditCard className="h-4 w-4" />
                        Subscription
                      </Link>
                      <Link
                        href="/auth/logout"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Link>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild className="w-full">
                        <Link href="/login" onClick={() => setMobileOpen(false)}>Login</Link>
                      </Button>
                      <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                        <Link href="/signup" onClick={() => setMobileOpen(false)}>Start Free</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
