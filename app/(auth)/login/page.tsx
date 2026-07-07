export const dynamic = 'force-dynamic'

import AuthLayout from '@/components/shared/AuthLayout'
import AuthForm from '@/components/shared/AuthForm'

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue practising">
      <AuthForm mode="login" />
    </AuthLayout>
  )
}
