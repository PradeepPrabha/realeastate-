import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Breadcrumbs, Button, Input, Select, Textarea } from '@/components/common'
import { useAuth } from '@/context/AuthContext'
import { useSeo } from '@/hooks/useSeo'
import { publicApi } from '@/services/api'
import { parseApiError } from '@/services/http'
import { PROPERTY_TYPES } from '@/utils/constants'
import PageHero from './PageHero'

const schema = z.object({
  name: z.string().min(2, 'Enter your name'), phone: z.string().regex(/^[+]?[0-9\s-]{10,15}$/, 'Enter a valid phone number'), email: z.string().email('Enter a valid email'), purpose: z.enum(['sale', 'rent', 'lease']),
  type: z.string().min(1, 'Select property type'), city: z.string().min(2, 'Enter city'), locality: z.string().min(2, 'Enter locality'), expectedPrice: z.string().refine((v) => Number(v) > 0, 'Enter expected price / rent'), description: z.string().min(10, 'Add a few details'),
})
type V = z.infer<typeof schema>

export default function SellProperty() {
  useSeo({ title: 'Sell or Rent Your Property', description: 'List your property with TN HOMES and reach genuine buyers and tenants across Tamil Nadu.' })
  const { user } = useAuth()
  const [done, setDone] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<V>({ resolver: zodResolver(schema), defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '', email: user?.email ?? '', purpose: 'sale' } })
  const m = useMutation({ mutationFn: (v: V) => publicApi.sellRequest({ ...v, expectedPrice: Number(v.expectedPrice) }), onSuccess: () => { setDone(true); reset(); toast.success('Request submitted') }, onError: (e) => toast.error(parseApiError(e).message) })
  return (
    <>
      <PageHero title="Sell or Rent Your Property" sub="Reach thousands of genuine buyers and tenants across Tamil Nadu." image="/images/villa-sunset.webp" />
      <div className="container-page max-w-3xl py-8">
        <Breadcrumbs items={[{ label: 'Sell / Rent Your Property' }]} />
        {done ? (
          <div className="card mt-5 p-10 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-brand-green" /><h2 className="mt-3 text-2xl font-extrabold">Thank you!</h2><p className="mt-1 text-slate-600">Our team will review your property and an agent will contact you within one working day.</p><div className="mt-5 flex justify-center gap-2"><button className="btn-outline" onClick={() => setDone(false)}>Submit another</button>{user?.role === 'customer' && <Link to="/customer/sell-requests" className="btn-primary">View my requests</Link>}</div></div>
        ) : (
          <form onSubmit={handleSubmit((v) => m.mutate(v))} className="card mt-5 space-y-4 p-6" noValidate>
            <div className="grid gap-4 sm:grid-cols-2"><Input label="Your name" required error={errors.name?.message} {...register('name')} /><Input label="Phone" type="tel" required error={errors.phone?.message} {...register('phone')} /><Input wrapperClassName="sm:col-span-2" label="Email" type="email" required error={errors.email?.message} {...register('email')} />
              <Select label="I want to" options={[{ value: 'sale', label: 'Sell' }, { value: 'rent', label: 'Rent out' }, { value: 'lease', label: 'Lease out' }]} {...register('purpose')} /><Select label="Property type" required placeholder="Select type" options={PROPERTY_TYPES} error={errors.type?.message} {...register('type')} />
              <Input label="City" required error={errors.city?.message} {...register('city')} /><Input label="Locality" required error={errors.locality?.message} {...register('locality')} /><Input wrapperClassName="sm:col-span-2" label="Expected price / monthly rent (₹)" type="number" min={0} required error={errors.expectedPrice?.message} {...register('expectedPrice')} /></div>
            <Textarea label="Property details" rows={4} required error={errors.description?.message} {...register('description')} />
            <Button type="submit" loading={m.isPending} size="lg">Submit Property</Button>
          </form>
        )}
      </div>
    </>
  )
}
