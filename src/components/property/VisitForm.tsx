import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { CalendarCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { Button, Input, Select, Textarea } from '@/components/common'
import { useAuth } from '@/context/AuthContext'
import { customerApi } from '@/services/api'
import { parseApiError } from '@/services/http'
import type { Property } from '@/types'

const TIMES = ['10:00 AM', '11:30 AM', '01:00 PM', '03:00 PM', '04:30 PM', '06:00 PM']
const schema = z.object({ date: z.string().min(1, 'Choose a date'), time: z.string().min(1, 'Choose a time slot'), phone: z.string().regex(/^[+]?[0-9\s-]{10,15}$/, 'Enter a valid phone number'), notes: z.string().max(300).optional() })
type Values = z.infer<typeof schema>

export default function VisitForm({ property, onDone }: { property: Property; onDone?: () => void }) {
  const { user } = useAuth()
  const loc = useLocation()
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { phone: user?.phone ?? '', date: '', time: '' } })
  const m = useMutation({
    mutationFn: (v: Values) => customerApi.book({ ...v, propertyId: property.id }),
    onSuccess: () => { toast.success('Site visit requested. You will be notified once confirmed.'); reset(); void qc.invalidateQueries({ queryKey: ['appointments'] }); onDone?.() },
    onError: (e) => toast.error(parseApiError(e).message),
  })
  if (!user || user.role !== 'customer') {
    return (
      <div className="rounded-xl bg-navy-50 p-4 text-center text-sm">
        <CalendarCheck className="mx-auto mb-2 h-7 w-7 text-gold" />
        <p className="mb-3 text-slate-600">{user ? 'Site visits can be booked from a customer account.' : 'Log in to book a site visit for this property.'}</p>
        {!user && <Link to="/login" state={{ from: loc.pathname }} className="btn-primary">Log in to continue</Link>}
      </div>
    )
  }
  return (
    <form onSubmit={handleSubmit((v) => m.mutate(v))} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Preferred date" type="date" min={format(addDays(new Date(), 1), 'yyyy-MM-dd')} error={errors.date?.message} {...register('date')} />
        <Select label="Time slot" options={TIMES} placeholder="Select time" error={errors.time?.message} {...register('time')} />
      </div>
      <Input label="Contact phone" type="tel" error={errors.phone?.message} {...register('phone')} />
      <Textarea label="Notes (optional)" rows={2} {...register('notes')} />
      <Button type="submit" full loading={m.isPending} icon={<CalendarCheck className="h-4 w-4" />}>Schedule Site Visit</Button>
    </form>
  )
}
