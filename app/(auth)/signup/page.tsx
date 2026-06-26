export const dynamic = 'force-dynamic'

import AuthLayout from '@/components/shared/AuthLayout'
import GoogleAuthButton from '@/components/shared/GoogleAuthButton'

export default function SignupPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Get started with your interview prep">
      <GoogleAuthButton mode="signup" />
    </AuthLayout>
  )
}
