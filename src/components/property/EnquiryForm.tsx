import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { Button, Input, Textarea } from '@/components/common'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/hooks/useSettings'
import { customerApi, publicApi } from '@/services/api'
import { parseApiError } from '@/services/http'
import type { Property } from '@/types'
import { whatsappLink } from '@/utils/format'

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  phone: z.string().regex(/^[+]?[0-9\s-]{10,15}$/, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email').or(z.literal('')),
  message: z.string().min(10, 'Please write at least 10 characters'),
  consent: z.boolean().refine((v) => v, 'Please accept to be contacted'),
  website: z.string().max(0).optional(), // honeypot – bots fill this
})
type Values = z.infer<typeof schema>

export default function EnquiryForm({ property, onDone }: { property?: Property; onDone?: () => void }) {
  const { user } = useAuth()
  const s = useSettings()
  const qc = useQueryClient()
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '', email: user?.email ?? '', message: property ? `Hi, I am interested in ${property.title} (${property.code}) at ${property.locality}, ${property.city}. Please share more details.` : '', consent: false },
  })
  const m = useMutation({
    mutationFn: (v: Values) => {
      const body = { name: v.name, phone: v.phone, email: v.email, message: v.message, propertyId: property?.id, source: 'Website' }
      return user?.role === 'customer' ? customerApi.enquire(body) : publicApi.enquire(body)
    },
    onSuccess: () => { toast.success('Enquiry sent! An agent will contact you shortly.'); reset(); void qc.invalidateQueries({ queryKey: ['enquiries'] }); onDone?.() },
    onError: (e) => { const err = parseApiError(e); Object.entries(err.fields).forEach(([k, v]) => setError(k as keyof Values, { message: v })); toast.error(err.message) },
  })
  return (
    <form onSubmit={handleSubmit((v) => m.mutate(v))} className="space-y-3" noValidate>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px]" {...register('website')} />
      <Input label="Full name" placeholder="Your name" error={errors.name?.message} {...register('name')} />
      <div className="grid gap-3 sm:grid-cols-2"><Input label="Phone" type="tel" placeholder="+91 98765 43210" error={errors.phone?.message} {...register('phone')} /><Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} /></div>
      <Textarea label="Message" rows={4} error={errors.message?.message} {...register('message')} />
      <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" className="mt-0.5 accent-gold" {...register('consent')} />I agree to be contacted by TN HOMES and its agents by phone, email or WhatsApp regarding this enquiry.</label>
      {errors.consent && <p role="alert" className="text-xs font-medium text-red-600">{errors.consent.message}</p>}
      <Button type="submit" full loading={m.isPending}>Send Enquiry</Button>
      {property && <a href={whatsappLink(s.whatsapp, `Hi, I am interested in ${property.title} (${property.code}).`)} target="_blank" rel="noreferrer" className="btn w-full bg-[#25D366] text-white hover:bg-[#1da851]"><MessageCircle className="h-4 w-4" />Chat on WhatsApp</a>}
    </form>
  )
}
