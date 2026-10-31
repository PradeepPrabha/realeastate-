import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CalendarCheck, Heart, MessageSquare, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button, ConfirmDialog, DataTable, EmptyState, ErrorState, Input, Skeleton, StatCard, StatusBadge, Textarea } from '@/components/common'
import type { Column } from '@/components/common'
import PageHeader from '@/components/dashboard/PageHeader'
import PropertyCard from '@/components/property/PropertyCard'
import { useAuth } from '@/context/AuthContext'
import { useFavorites } from '@/hooks/useFavorites'
import { useSeo } from '@/hooks/useSeo'
import { authApi, customerApi, notificationApi } from '@/services/api'
import { parseApiError } from '@/services/http'
import type { Appointment, Enquiry, SavedSearch, SellRentRequest } from '@/types'
import { fmtDate, formatINR, purposeLabel, timeAgo } from '@/utils/format'
import Compare from '../public/Compare'

export function CustomerDashboard() {
  useSeo({ title: 'Customer Dashboard' })
  const { user } = useAuth()
  const q = useQuery({ queryKey: ['customer-dashboard'], queryFn: customerApi.dashboard })
  const d = q.data
  return (
    <>
      <PageHeader title={`Welcome, ${user?.name.split(' ')[0]}`} subtitle="Here is a summary of your property activity." actions={<Link to="/buy" className="btn-primary">Browse properties</Link>} />
      {q.isError ? <ErrorState onRetry={() => void q.refetch()} /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{!d ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />) : <>
            <StatCard label="Total enquiries" value={d.totalEnquiries} icon={<MessageSquare />} /><StatCard label="Saved properties" value={d.savedProperties} icon={<Heart />} tone="red" />
            <StatCard label="Upcoming visits" value={d.upcomingAppointments} icon={<CalendarCheck />} tone="green" /><StatCard label="Property alerts" value={d.alerts} icon={<Bell />} tone="gold" /></>}</div>
          <div className="card mt-6 p-5"><h2 className="mb-3 text-base font-bold">Recent activity</h2>
            {!d ? <Skeleton className="h-24" /> : d.recent.length ? <ul className="divide-y">{d.recent.map((r) => <li key={r.id} className="flex justify-between gap-3 py-2.5 text-sm"><span>{r.text}</span><span className="shrink-0 text-xs text-slate-500">{timeAgo(r.at)}</span></li>)}</ul> : <EmptyState title="No activity yet" message="Save a property or send an enquiry to get started." />}</div>
        </>
      )}
    </>
  )
}

export function CustomerFavorites() {
  useSeo({ title: 'Saved Properties' })
  const { favorites, loading } = useFavorites()
  return (<><PageHeader title="Saved Properties" subtitle="Properties you have marked as favorites." />
    {loading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-80" />)}</div> : favorites.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{favorites.map((p) => <PropertyCard key={p.id} p={p} />)}</div> : <EmptyState title="No saved properties" message="Tap the heart on any property to save it here." action={<Link to="/buy" className="btn-primary">Browse properties</Link>} />}</>)
}

export const CustomerCompare = () => <><PageHeader title="Compare Properties" subtitle="Compare up to four properties side by side." /><Compare embedded /></>

export function CustomerEnquiries() {
  useSeo({ title: 'My Enquiries' })
  const q = useQuery({ queryKey: ['enquiries'], queryFn: customerApi.enquiries })
  const cols: Column<Enquiry>[] = [
    { key: 'code', header: 'ID' }, { key: 'propertyTitle', header: 'Property', render: (e) => e.propertyTitle ?? 'General enquiry' }, { key: 'message', header: 'Message', render: (e) => <span className="line-clamp-1 max-w-xs">{e.message}</span> },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> }, { key: 'createdAt', header: 'Date', render: (e) => fmtDate(e.createdAt) },
  ]
  return (<><PageHeader title="My Enquiries" subtitle="History of your property enquiries." /><DataTable columns={cols} rows={q.data ?? []} rowKey={(r) => r.id} loading={q.isLoading} emptyTitle="No enquiries yet" emptyMessage="Enquire about a property and it will appear here." /></>)
}

export function CustomerAppointments() {
  useSeo({ title: 'Site Visits' })
  const qc = useQueryClient()
  const [cancel, setCancel] = useState<Appointment | null>(null)
  const q = useQuery({ queryKey: ['appointments'], queryFn: customerApi.appointments })
  const m = useMutation({ mutationFn: (id: number) => customerApi.cancelAppointment(id), onSuccess: () => { toast.success('Visit cancelled'); setCancel(null); void qc.invalidateQueries({ queryKey: ['appointments'] }) }, onError: (e) => toast.error(parseApiError(e).message) })
  const cols: Column<Appointment>[] = [
    { key: 'code', header: 'ID' }, { key: 'propertyTitle', header: 'Property' }, { key: 'date', header: 'Date', render: (a) => fmtDate(a.date) }, { key: 'time', header: 'Time' },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    { key: 'actions', header: '', render: (a) => a.status === 'pending' || a.status === 'confirmed' ? <Button variant="ghost" size="sm" onClick={() => setCancel(a)}>Cancel</Button> : null },
  ]
  return (<><PageHeader title="Site Visits" subtitle="Your scheduled property visits and their status." />
    <DataTable columns={cols} rows={q.data ?? []} rowKey={(r) => r.id} loading={q.isLoading} emptyTitle="No site visits" emptyMessage="Open a property and choose Schedule Site Visit." />
    <ConfirmDialog open={!!cancel} message={`Cancel your visit to ${cancel?.propertyTitle}?`} confirmLabel="Cancel visit" loading={m.isPending} onConfirm={() => cancel && m.mutate(cancel.id)} onCancel={() => setCancel(null)} /></>)
}

export function CustomerAlerts() {
  useSeo({ title: 'Property Alerts' })
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['alerts'], queryFn: customerApi.alerts })
  const del = useMutation({ mutationFn: customerApi.removeAlert, onSuccess: () => { toast.success('Alert removed'); void qc.invalidateQueries({ queryKey: ['alerts'] }) } })
  return (<><PageHeader title="Property Alerts" subtitle="Get notified when new properties match your saved searches. Create alerts from any listing page." actions={<Link to="/buy" className="btn-primary">Create from search</Link>} />
    {q.isLoading ? <Skeleton className="h-32" /> : q.data?.length ? <div className="space-y-3">{q.data.map((a: SavedSearch) => (
      <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-bold">{a.label}</p><p className="text-xs text-slate-500">Notify: {a.frequency} · Saved {fmtDate(a.createdAt)}</p></div>
        <div className="flex gap-2"><Link to={`/buy?${a.query}`} className="btn-outline">View results</Link><button aria-label="Delete alert" onClick={() => del.mutate(a.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-5 w-5" /></button></div></div>))}</div> : <EmptyState title="No alerts yet" message="Use the Save alert button on a search to be notified about new matching properties." />}</>)
}

export function CustomerSellRequests() {
  useSeo({ title: 'Sell / Rent Requests' })
  const q = useQuery({ queryKey: ['sell-requests'], queryFn: customerApi.sellRequests })
  const cols: Column<SellRentRequest>[] = [
    { key: 'code', header: 'ID' }, { key: 'purpose', header: 'Purpose', render: (r) => purposeLabel(r.purpose) }, { key: 'type', header: 'Type' }, { key: 'city', header: 'Location', render: (r) => `${r.locality}, ${r.city}` },
    { key: 'expectedPrice', header: 'Expected', render: (r) => formatINR(r.expectedPrice) }, { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> }, { key: 'createdAt', header: 'Date', render: (r) => fmtDate(r.createdAt) },
  ]
  return (<><PageHeader title="Sell / Rent Requests" subtitle="Properties you have submitted to list with us." actions={<Link to="/sell" className="btn-primary">New request</Link>} /><DataTable columns={cols} rows={q.data ?? []} rowKey={(r) => r.id} loading={q.isLoading} emptyTitle="No requests yet" /></>)
}

export function NotificationsPage() {
  useSeo({ title: 'Notifications' })
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['notifications'], queryFn: notificationApi.list })
  const readAll = useMutation({ mutationFn: notificationApi.readAll, onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }) })
  const read = useMutation({ mutationFn: notificationApi.read, onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }) })
  const unread = (q.data ?? []).filter((n) => !n.read).length
  return (<><PageHeader title="Notifications" subtitle={unread ? `${unread} unread` : 'You are all caught up.'} actions={unread > 0 ? <Button variant="outline" onClick={() => readAll.mutate()} loading={readAll.isPending}>Mark all as read</Button> : undefined} />
    {q.isLoading ? <Skeleton className="h-40" /> : q.data?.length ? <ul className="card divide-y">{q.data.map((n) => <li key={n.id} className={`flex items-start gap-3 p-4 ${n.read ? '' : 'bg-gold-50/50'}`}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-300' : 'bg-gold'}`} /><div className="flex-1"><p className="text-sm font-bold">{n.title}</p><p className="text-sm text-slate-600">{n.body}</p><p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.createdAt)}</p></div>{!n.read && <button onClick={() => read.mutate(n.id)} className="text-xs font-semibold text-gold-600 hover:underline">Mark read</button>}</li>)}</ul> : <EmptyState title="No notifications" icon={<Bell className="h-7 w-7" />} />}</>)
}

const profileSchema = z.object({ name: z.string().min(2, 'Enter your name'), phone: z.string().regex(/^[+]?[0-9\s-]{10,15}$/, 'Enter a valid phone number'), city: z.string(), address: z.string() })
const pwSchema = z.object({ currentPassword: z.string().min(1, 'Required'), newPassword: z.string().min(8, 'At least 8 characters').regex(/\d/, 'Include a number') })
export function ProfileSettings({ title = 'My Profile' }: { title?: string }) {
  useSeo({ title })
  const { user, setUser } = useAuth()
  const p = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '', city: user?.city ?? '', address: user?.address ?? '' } })
  const pw = useForm<z.infer<typeof pwSchema>>({ resolver: zodResolver(pwSchema) })
  const save = useMutation({ mutationFn: (v: z.infer<typeof profileSchema>) => authApi.updateProfile(v), onSuccess: (u) => { setUser(u); toast.success('Profile updated') }, onError: (e) => toast.error(parseApiError(e).message) })
  const change = useMutation({ mutationFn: authApi.changePassword, onSuccess: () => { toast.success('Password changed'); pw.reset() }, onError: (e) => { const er = parseApiError(e); Object.entries(er.fields).forEach(([k, v]) => pw.setError(k as 'currentPassword', { message: v })) } })
  return (<><PageHeader title={title} subtitle="Manage your personal information." />
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={p.handleSubmit((v) => save.mutate(v))} className="card space-y-4 p-5" noValidate><h2 className="font-bold">Personal details</h2>
        <Input label="Full name" error={p.formState.errors.name?.message} {...p.register('name')} /><Input label="Email" value={user?.email} disabled readOnly /><Input label="Phone" error={p.formState.errors.phone?.message} {...p.register('phone')} /><Input label="City" {...p.register('city')} /><Textarea label="Address" rows={2} {...p.register('address')} />
        <Button type="submit" loading={save.isPending}>Save changes</Button></form>
      <form onSubmit={pw.handleSubmit((v) => change.mutate(v))} className="card h-fit space-y-4 p-5" noValidate><h2 className="font-bold">Change password</h2>
        <Input label="Current password" type="password" autoComplete="current-password" error={pw.formState.errors.currentPassword?.message} {...pw.register('currentPassword')} /><Input label="New password" type="password" autoComplete="new-password" error={pw.formState.errors.newPassword?.message} {...pw.register('newPassword')} />
        <Button type="submit" variant="navy" loading={change.isPending}>Update password</Button></form>
    </div></>)
}

export function CustomerSettings() {
  useSeo({ title: 'Settings' })
  const { user, setUser } = useAuth()
  const m = useMutation({ mutationFn: (b: { whatsappConsent: boolean; emailConsent: boolean }) => authApi.updateProfile({ ...user, ...b }), onSuccess: (u) => { setUser(u); toast.success('Preferences saved') } })
  return (<><PageHeader title="Settings" subtitle="Communication preferences and account." />
    <div className="card max-w-xl space-y-4 p-5"><h2 className="font-bold">Communication consent</h2>
      {([['emailConsent', 'Email notifications', 'Enquiry acknowledgements, appointment confirmations and alerts.'], ['whatsappConsent', 'WhatsApp updates', 'Appointment confirmations and follow-up reminders.']] as const).map(([k, l, d]) => (
        <label key={k} className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-4 w-4 accent-gold" checked={!!user?.[k]} onChange={(e) => m.mutate({ whatsappConsent: !!user?.whatsappConsent, emailConsent: !!user?.emailConsent, [k]: e.target.checked })} /><span><span className="block text-sm font-semibold">{l}</span><span className="text-xs text-slate-500">{d}</span></span></label>))}</div></>)
}
