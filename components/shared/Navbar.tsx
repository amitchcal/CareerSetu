'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Briefcase, ChevronDown, User, CreditCard, LogOut, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface NavbarProps {
  isLoggedIn?: boolean
  user?: {
    name?: string
    email?: string
    avatarUrl?: string
  }
}

export default function Navbar({ isLoggedIn = false, user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = isLoggedIn
    ? [{ href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> }]
    : [
        { href: '/#how-it-works', label: 'How it works' },
        { href: '/pricing', label: 'Pricing' },
      ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CareerSetu</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                {'icon' in link && link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
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
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-6 pt-6">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                    <Briefcase className="h-4 w-4 text-white" />
                  </div>
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

                <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
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
