export const dynamic = 'force-dynamic'

import AuthLayout from '@/components/shared/AuthLayout'
import PhoneAuthForm from '@/components/shared/PhoneAuthForm'

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Log in with your mobile number">
      <PhoneAuthForm mode="login" />
    </AuthLayout>
  )
}
