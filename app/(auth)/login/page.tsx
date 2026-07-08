'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Briefcase, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { auth, googleProvider } from '@/lib/firebase'
import { signInWithPopup } from 'firebase/auth'
import { toast } from '@/hooks/useToast'

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.532 24.552c0-1.636-.146-3.2-.418-4.698H24.48v8.883h12.974c-.56 3.02-2.25 5.576-4.792 7.29v6.058h7.757c4.54-4.18 7.113-10.332 7.113-17.533z" fill="#4285F4"/>
      <path d="M24.48 48c6.516 0 11.98-2.16 15.974-5.852l-7.757-6.058c-2.16 1.446-4.92 2.3-8.217 2.3-6.32 0-11.67-4.268-13.583-10.01H2.86v6.254C6.838 42.818 15.066 48 24.48 48z" fill="#34A853"/>
      <path d="M10.897 28.38A14.45 14.45 0 0 1 10.14 24c0-1.524.262-3.002.757-4.38V13.366H2.86A23.962 23.962 0 0 0 .48 24c0 3.868.926 7.524 2.38 10.634l8.037-6.254z" fill="#FBBC05"/>
      <path d="M24.48 9.61c3.558 0 6.75 1.224 9.264 3.626l6.944-6.944C36.454 2.39 30.994 0 24.48 0 15.066 0 6.838 5.182 2.86 13.366l8.037 6.254C12.81 13.878 18.16 9.61 24.48 9.61z" fill="#EA4335"/>
    </svg>
  )
}

type Step = 'main' | 'otp'

function LoginForm() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('main')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingOtp, setLoadingOtp] = useState(false)
  const [loadingVerify, setLoadingVerify] = useState(false)

  async function afterSupabaseAuth(userId: string) {
    const { data: user } = await supabase
      .from('users')
      .select('onboarding_complete')
      .eq('id', userId)
      .maybeSingle()
    router.push(user?.onboarding_complete ? '/dashboard' : '/onboarding/profile')
  }

  async function handleGoogle() {
    setLoadingGoogle(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const { email: firebaseEmail, uid, displayName } = result.user
      if (!firebaseEmail) throw new Error('Google account has no email.')

      const deterministicPassword = `FIREBASE_${uid}`

      const signInResult = await supabase.auth.signInWithPassword({
        email: firebaseEmail,
        password: deterministicPassword,
      })

      let userId: string | undefined
      if (signInResult.error) {
        const signUpResult = await supabase.auth.signUp({
          email: firebaseEmail,
          password: deterministicPassword,
        })
        if (signUpResult.error) throw signUpResult.error
        userId = signUpResult.data.user?.id
      } else {
        userId = signInResult.data.user?.id
      }

      if (!userId) throw new Error('Authentication failed.')

      await supabase.from('users').upsert(
        { id: userId, email: firebaseEmail, name: displayName ?? undefined },
        { onConflict: 'id', ignoreDuplicates: false }
      )

      await afterSupabaseAuth(userId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed.'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setLoadingGoogle(false)
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!isEmail(email)) {
      setEmailError('Enter a valid email address.')
      return
    }
    setEmailError('')
    setLoadingOtp(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })
      if (error) throw error
      setStep('otp')
      toast({ title: 'Code sent', description: `Check ${email} for a 6-digit code.` })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not send code.'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setLoadingOtp(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setOtpError('Enter the 6-digit code from your email.')
      return
    }
    setOtpError('')
    setLoadingVerify(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      })
      if (error) throw error
      const userId = data.user?.id
      if (!userId) throw new Error('Verification failed.')

      await supabase.from('users').upsert(
        { id: userId, email: email.trim() },
        { onConflict: 'id', ignoreDuplicates: true }
      )

      await afterSupabaseAuth(userId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed.'
      const friendly = message.includes('invalid') || message.includes('expired')
        ? 'Invalid or expired code. Please try again.'
        : message
      toast({ title: 'Error', description: friendly, variant: 'destructive' })
    } finally {
      setLoadingVerify(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900">CareerSetu</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {step === 'main' ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
              <p className="mt-1.5 text-sm text-gray-500">Sign in to continue practising</p>
            </div>

            <button
              onClick={handleGoogle}
              disabled={loadingGoogle}
              className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSendOtp} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
                  className={`rounded-xl border-2 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${emailError ? 'border-red-400' : 'border-gray-200'}`}
                />
                {emailError && <p className="text-xs text-red-600">{emailError}</p>}
              </div>

              <button type="submit" disabled={loadingOtp}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                {loadingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send login code
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              New to CareerSetu?{' '}
              <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">Sign up free</Link>
            </p>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-gray-900">Enter your code</h1>
              <p className="mt-1.5 text-sm text-gray-500">
                We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="otp" className="text-sm font-medium text-gray-700">6-digit code</label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); if (otpError) setOtpError('') }}
                  className={`rounded-xl border-2 px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all tracking-[0.3em] text-center focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${otpError ? 'border-red-400' : 'border-gray-200'}`}
                />
                {otpError && <p className="text-xs text-red-600">{otpError}</p>}
              </div>

              <button type="submit" disabled={loadingVerify}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                {loadingVerify && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify & sign in
              </button>

              <button type="button" onClick={() => { setStep('main'); setOtp(''); setOtpError('') }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                ← Use a different email
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
