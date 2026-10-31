import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { Breadcrumbs, Button, Input, Textarea } from '@/components/common'
import { useSeo } from '@/hooks/useSeo'
import { useSettings } from '@/hooks/useSettings'
import { publicApi } from '@/services/api'
import { parseApiError } from '@/services/http'
import PageHero from './PageHero'

const schema = z.object({ name: z.string().min(2, 'Enter your name'), email: z.string().email('Enter a valid email'), phone: z.string().regex(/^[+]?[0-9\s-]{10,15}$/, 'Enter a valid phone number').or(z.literal('')), subject: z.string().min(3, 'Enter a subject'), message: z.string().min(10, 'Please write at least 10 characters') })
type V = z.infer<typeof schema>

export default function Contact() {
  useSeo({ title: 'Contact Us', description: 'Get in touch with TN HOMES for buying, selling or renting property in Tamil Nadu.' })
  const s = useSettings()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<V>({ resolver: zodResolver(schema) })
  const m = useMutation({ mutationFn: (v: V) => publicApi.contact(v), onSuccess: (r) => { toast.success(r.message); reset() }, onError: (e) => toast.error(parseApiError(e).message) })
  const info = [[MapPin, 'Address', s.address], [Phone, 'Phone', s.phone], [Mail, 'Email', s.email], [Clock, 'Working hours', s.hours]] as const
  return (
    <>
      <PageHero title="Contact Us" sub="We are here to help you with every step of your property journey." />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Contact Us' }]} />
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_380px]">
          <form onSubmit={handleSubmit((v) => m.mutate(v))} className="card space-y-4 p-6" noValidate>
            <h2 className="text-xl font-bold">Send us a message</h2>
            <div className="grid gap-4 sm:grid-cols-2"><Input label="Name" error={errors.name?.message} {...register('name')} /><Input label="Email" type="email" error={errors.email?.message} {...register('email')} /><Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} /><Input label="Subject" error={errors.subject?.message} {...register('subject')} /></div>
            <Textarea label="Message" rows={5} error={errors.message?.message} {...register('message')} />
            <Button type="submit" loading={m.isPending}>Send Message</Button>
          </form>
          <div className="space-y-4"><div className="card divide-y">{info.map(([I, l, v]) => <div key={l} className="flex gap-3 p-4"><I className="h-5 w-5 shrink-0 text-gold" /><div><p className="text-xs font-semibold uppercase text-slate-500">{l}</p><p className="text-sm font-medium">{v}</p></div></div>)}</div>
            <iframe title="TN HOMES office location" src="https://www.google.com/maps?q=Coimbatore,Tamil Nadu&output=embed" loading="lazy" className="h-56 w-full rounded-xl border-0" /></div>
        </div>
      </div>
    </>
  )
}
