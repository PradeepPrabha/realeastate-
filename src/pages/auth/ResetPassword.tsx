import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button, Input } from '@/components/common'
import AuthLayout from '@/components/layout/AuthLayout'
import { useSeo } from '@/hooks/useSeo'
import { authApi } from '@/services/api'
import { parseApiError } from '@/services/http'

const schema = z.object({ password: z.string().min(8, 'At least 8 characters').regex(/\d/, 'Include a number'), confirm: z.string() }).refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
type V = z.infer<typeof schema>
export default function ResetPassword() {
  useSeo({ title: 'Reset password' })
  const token = useSearchParams()[0].get('token') ?? ''
  const nav = useNavigate()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<V>({ resolver: zodResolver(schema) })
  const m = useMutation({ mutationFn: (v: V) => authApi.reset({ token, password: v.password }), onSuccess: () => { toast.success('Password updated. Please log in.'); nav('/login') }, onError: (e) => setError('password', { message: parseApiError(e).fields.token ?? parseApiError(e).message }) })
  return (
    <AuthLayout title="Set a new password" footer={<Link to="/login" className="font-semibold text-gold-600">← Back to login</Link>}>
      {!token ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">This reset link is invalid. <Link className="font-semibold underline" to="/forgot-password">Request a new one</Link>.</p> : (
        <form onSubmit={handleSubmit((v) => m.mutate(v))} className="space-y-4" noValidate>
          <Input label="New password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
          <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
          <Button type="submit" full size="lg" loading={m.isPending}>Update password</Button>
        </form>
      )}
    </AuthLayout>
  )
}
