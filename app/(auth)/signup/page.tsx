export const dynamic = 'force-dynamic'

import AuthLayout from '@/components/shared/AuthLayout'
import AuthForm from '@/components/shared/AuthForm'

export default function SignupPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Choose how you want to sign up">
      <AuthForm mode="signup" />
    </AuthLayout>
  )
}
