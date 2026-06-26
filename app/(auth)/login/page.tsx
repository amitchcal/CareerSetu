export const dynamic = 'force-dynamic'

import AuthLayout from '@/components/shared/AuthLayout'
import GoogleAuthButton from '@/components/shared/GoogleAuthButton'

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your interview prep">
      <GoogleAuthButton mode="login" />
    </AuthLayout>
  )
}
