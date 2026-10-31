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
import { parseApiError } from '@/services/http'

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'), email: z.string().email('Enter a valid email'), phone: z.string().regex(/^[+]?[0-9\s-]{10,15}$/, 'Enter a valid phone number'),
  password: z.string().min(8, 'At least 8 characters').regex(/[A-Za-z]/, 'Include a letter').regex(/\d/, 'Include a number'), confirm: z.string(), whatsappConsent: z.boolean(), terms: z.boolean().refine((v) => v, 'Please accept the terms'),
}).refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
type V = z.infer<typeof schema>

export default function Register() {
  useSeo({ title: 'Create your account' })
  const { user, register: signUp } = useAuth()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, setError, formState: { errors } } = useForm<V>({ resolver: zodResolver(schema), defaultValues: { whatsappConsent: true, terms: false } })
  if (user) return <Navigate to={homeFor(user.role)} replace />
  const submit = async (v: V) => {
    setBusy(true)
    try { await signUp({ name: v.name, email: v.email, phone: v.phone, password: v.password, whatsappConsent: v.whatsappConsent }); toast.success('Account created!'); nav(from ?? '/customer/dashboard', { replace: true }) }
    catch (e) { const err = parseApiError(e); Object.entries(err.fields).forEach(([k, m]) => setError(k as keyof V, { message: m })); if (!Object.keys(err.fields).length) toast.error(err.message) }
    finally { setBusy(false) }
  }
  return (
    <AuthLayout title="Create your account" subtitle="Save properties, compare homes and book site visits." footer={<>Already registered? <Link to="/login" className="font-semibold text-gold-600 hover:underline">Log in</Link></>}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
        <div className="grid gap-4 sm:grid-cols-2"><Input label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} /><Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} /></div>
        <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" className="mt-0.5 accent-gold" {...register('whatsappConsent')} />Send me enquiry and appointment updates on WhatsApp.</label>
        <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" className="mt-0.5 accent-gold" {...register('terms')} /><span>I agree to the <Link to="/terms" className="font-semibold text-gold-600">Terms</Link> and <Link to="/privacy" className="font-semibold text-gold-600">Privacy Policy</Link>.</span></label>
        {errors.terms && <p role="alert" className="text-xs font-medium text-red-600">{errors.terms.message}</p>}
        <Button type="submit" full size="lg" loading={busy}>Create account</Button>
      </form>
    </AuthLayout>
  )
}
