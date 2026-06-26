export const dynamic = 'force-dynamic'

import AuthLayout from '@/components/shared/AuthLayout'
import PhoneAuthForm from '@/components/shared/PhoneAuthForm'

export default function SignupPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Enter your mobile number to get started">
      <PhoneAuthForm mode="signup" />
    </AuthLayout>
  )
}
