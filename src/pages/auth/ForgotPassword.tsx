import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { MailCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button, Input } from '@/components/common'
import AuthLayout from '@/components/layout/AuthLayout'
import { useSeo } from '@/hooks/useSeo'
import { authApi } from '@/services/api'
import { parseApiError, USE_MOCK } from '@/services/http'

const schema = z.object({ email: z.string().email('Enter a valid email') })
export default function ForgotPassword() {
  useSeo({ title: 'Forgot password' })
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({ resolver: zodResolver(schema) })
  const m = useMutation({ mutationFn: (v: { email: string }) => authApi.forgot(v.email) })
  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we will send you a reset link." footer={<Link to="/login" className="font-semibold text-gold-600">← Back to login</Link>}>
      {m.isSuccess ? (
        <div className="rounded-xl bg-green-50 p-5 text-center"><MailCheck className="mx-auto h-10 w-10 text-brand-green" /><p className="mt-2 text-sm text-slate-700">{m.data.message}</p>
          {USE_MOCK && m.data.resetToken && <Link to={`/reset-password?token=${m.data.resetToken}`} className="btn-primary mt-4">Demo: open reset link</Link>}</div>
      ) : (
        <form onSubmit={handleSubmit((v) => m.mutate(v))} className="space-y-4" noValidate>
          <Input label="Email" type="email" error={errors.email?.message ?? (m.isError ? parseApiError(m.error).message : undefined)} {...register('email')} />
          <Button type="submit" full size="lg" loading={m.isPending}>Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  )
}
