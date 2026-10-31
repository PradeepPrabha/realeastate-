import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button, Input } from '@/components/common'
import AuthLayout from '@/components/layout/AuthLayout'
import { homeFor, useAuth } from '@/context/AuthContext'
import { useSeo } from '@/hooks/useSeo'
import { parseApiError, USE_MOCK } from '@/services/http'

const schema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') })
type V = z.infer<typeof schema>
const DEMO = [['Admin', 'admin@tnhomes.in', 'Admin@123'], ['Agent', 'agent@tnhomes.in', 'Agent@123'], ['Customer', 'customer@tnhomes.in', 'Customer@123']]

export default function Login() {
  useSeo({ title: 'Login' })
  const { user, login } = useAuth()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, setValue, setError, formState: { errors } } = useForm<V>({ resolver: zodResolver(schema) })
  if (user) return <Navigate to={from ?? homeFor(user.role)} replace />
  const submit = async (v: V) => {
    setBusy(true)
    try { const u = await login(v.email, v.password); toast.success(`Welcome back, ${u.name.split(' ')[0]}!`); nav(from ?? homeFor(u.role), { replace: true }) }
    catch (e) { const err = parseApiError(e); setError('email', { message: err.fields.email ?? err.message }) }
    finally { setBusy(false) }
  }
  return (
    <AuthLayout title="Welcome back" subtitle="Log in to manage your properties, enquiries and site visits." footer={<>New to TN HOMES? <Link to="/register" state={{ from }} className="font-semibold text-gold-600 hover:underline">Create an account</Link></>}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <div className="text-right"><Link to="/forgot-password" className="text-sm font-semibold text-gold-600 hover:underline">Forgot password?</Link></div>
        <Button type="submit" full size="lg" loading={busy}>Log in</Button>
      </form>
      {USE_MOCK && (
        <div className="mt-6 rounded-xl border border-dashed border-gold bg-gold-50 p-3 text-xs"><p className="mb-2 font-bold text-gold-700">Demo accounts (development only) – click to fill</p><div className="flex flex-wrap gap-2">{DEMO.map(([r, e, p]) => <button key={r} type="button" onClick={() => { setValue('email', e); setValue('password', p) }} className="rounded-md border border-gold bg-white px-3 py-1 font-semibold hover:bg-gold hover:text-white">{r}</button>)}</div></div>
      )}
    </AuthLayout>
  )
}
