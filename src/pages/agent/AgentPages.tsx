import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { Building2, CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight, MessageCircle, MessageSquare, Pencil, Phone, PhoneCall, Users } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, DataTable, EmptyState, ErrorState, Input, Modal, Select, Skeleton, StatCard, StatusBadge, Textarea } from '@/components/common'
import type { Column } from '@/components/common'
import { BarSeries, ChartCard, DonutChart, LineSeries } from '@/components/dashboard/Charts'
import PageHeader from '@/components/dashboard/PageHeader'
import PropertyForm from '@/components/property/PropertyForm'
import { useDebounce } from '@/hooks/useDebounce'
import { useSeo } from '@/hooks/useSeo'
import { agentApi } from '@/services/api'
import { parseApiError } from '@/services/http'
import type { Appointment, Lead, Property } from '@/types'
import { LEAD_STATUSES } from '@/utils/constants'
import { cx, fmtDate, fmtDateTime, formatShort, priceLabel, titleCase, whatsappLink } from '@/utils/format'

export function AgentDashboard() {
  useSeo({ title: 'Agent Dashboard' })
  const q = useQuery({ queryKey: ['agent-dashboard'], queryFn: agentApi.dashboard })
  const d = q.data
  const [open, setOpen] = useState<Lead | null>(null)
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} message={parseApiError(q.error).message} />
  return (<>
    <PageHeader title="Agent Dashboard" subtitle="Your properties, leads and visits at a glance." actions={<Link to="/agent/properties/new" className="btn-primary">+ Add Property</Link>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{!d ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24" />) : <>
      <StatCard label="Assigned properties" value={d.properties} icon={<Building2 />} /><StatCard label="Assigned leads" value={d.leads} icon={<Users />} tone="blue" /><StatCard label="New enquiries" value={d.newEnquiries} icon={<MessageSquare />} tone="gold" />
      <StatCard label="Contacted customers" value={d.contacted} icon={<PhoneCall />} tone="navy" /><StatCard label="Upcoming visits" value={d.upcomingVisits} icon={<CalendarCheck />} tone="green" /><StatCard label="Converted leads" value={d.converted} icon={<CheckCircle2 />} tone="green" /></>}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <ChartCard title="Lead funnel">{d && <BarSeries data={d.funnel.map((f) => ({ name: titleCase(f.status), count: f.count }))} keys={[{ key: 'count', name: 'Leads', color: '#C9962B' }]} />}</ChartCard>
      <div className="card p-4"><h3 className="mb-3 text-sm font-bold">Follow-ups due</h3>{!d ? <Skeleton className="h-40" /> : d.followUps.length ? <ul className="divide-y">{d.followUps.map((l) => <li key={l.id}><button onClick={() => setOpen(l)} className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm hover:text-gold-600"><span><b>{l.name}</b><span className="block text-xs text-slate-500">{l.propertyTitle}</span></span><span className="text-xs text-slate-500">{l.nextFollowUp && fmtDate(l.nextFollowUp)}</span></button></li>)}</ul> : <EmptyState title="No follow-ups due" message="You are all caught up." />}</div>
    </div>
    <LeadModal lead={open} onClose={() => setOpen(null)} />
  </>)
}

export function AgentProperties() {
  useSeo({ title: 'My Properties' })
  const [page, setPage] = useState(1)
  const [term, setTerm] = useState('')
  const dq = useDebounce(term)
  const q = useQuery({ queryKey: ['agent-properties', page, dq], queryFn: () => agentApi.properties({ page, q: dq }), placeholderData: (p) => p })
  const cols: Column<Property>[] = [
    { key: 'title', header: 'Property', render: (p) => <div className="flex items-center gap-3"><img src={p.images[0]} alt="" className="h-12 w-16 rounded object-cover" /><div><Link to={`/property/${p.slug}`} className="font-semibold hover:text-gold-600">{p.title}</Link><p className="text-xs text-slate-500">{p.code} · {p.locality}, {p.city}</p></div></div> },
    { key: 'price', header: 'Price', render: (p) => priceLabel(p) }, { key: 'verification', header: 'Verification', render: (p) => <StatusBadge status={p.verification} /> }, { key: 'listing', header: 'Listing', render: (p) => <StatusBadge status={p.listing} /> }, { key: 'views', header: 'Views' },
    { key: 'actions', header: '', render: (p) => <Link to={`/agent/properties/${p.id}/edit`} className="btn-ghost !py-1.5" aria-label={`Edit ${p.title}`}><Pencil className="h-4 w-4" />Edit</Link> },
  ]
  return (<><PageHeader title="My Properties" subtitle="Manage the listings assigned to you." actions={<><input value={term} onChange={(e) => { setTerm(e.target.value); setPage(1) }} placeholder="Search properties" aria-label="Search properties" className="input !w-56" /><Link to="/agent/properties/new" className="btn-primary">+ Add Property</Link></>} />
    <DataTable columns={cols} rows={q.data?.data ?? []} rowKey={(r) => r.id} loading={q.isLoading} meta={q.data?.meta} onPage={setPage} emptyTitle="No properties yet" emptyMessage="Add your first property to get started." /></>)
}

export function AgentPropertyForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const qc = useQueryClient()
  useSeo({ title: id ? 'Edit Property' : 'Add Property' })
  const existing = useQuery({ queryKey: ['agent-properties', 'all'], queryFn: () => agentApi.properties({ perPage: 100 }), enabled: !!id })
  const prop = existing.data?.data.find((p) => p.id === Number(id))
  if (id && existing.isLoading) return <Skeleton className="h-96" />
  if (id && !prop) return <ErrorState message="Property not found or not assigned to you." />
  return (<><PageHeader title={id ? 'Edit Property' : 'Add Property'} subtitle={id ? prop?.code : 'New listings are reviewed by an admin before going live.'} />
    <PropertyForm mode="agent" property={prop} submitLabel={id ? 'Save Changes' : 'Submit for Review'} onSubmit={async (b) => { const r = id ? await agentApi.updateProperty(Number(id), b) : await agentApi.createProperty(b); toast.success(id ? 'Property updated' : 'Property submitted for verification'); await qc.invalidateQueries({ queryKey: ['agent-properties'] }); nav('/agent/properties'); return r }} /></>)
}

/* ---------- leads ---------- */
function LeadModal({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const [follow, setFollow] = useState('')
  const cur = useQuery({ queryKey: ['agent-leads', 'all'], queryFn: () => agentApi.leads(), enabled: !!lead })
  const l = cur.data?.find((x) => x.id === lead?.id) ?? lead
  const inv = () => { void qc.invalidateQueries({ queryKey: ['agent-leads'] }); void qc.invalidateQueries({ queryKey: ['agent-dashboard'] }) }
  const status = useMutation({ mutationFn: (b: Record<string, unknown>) => agentApi.setLeadStatus(l!.id, b), onSuccess: () => { toast.success('Lead updated'); inv() }, onError: (e) => toast.error(parseApiError(e).message) })
  const add = useMutation({ mutationFn: (b: Record<string, unknown>) => agentApi.addActivity(l!.id, b), onSuccess: () => { toast.success('Note added'); setNote(''); setFollow(''); inv() }, onError: (e) => toast.error(parseApiError(e).message) })
  return (
    <Modal open={!!lead} onClose={onClose} title={l ? `${l.code} · ${l.name}` : ''} size="lg">
      {l && <div className="space-y-5">
        <div className="grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Phone:</span> {l.phone}</p><p><span className="text-slate-500">Email:</span> {l.email || '—'}</p><p><span className="text-slate-500">Property:</span> {l.propertyTitle ?? '—'}</p><p><span className="text-slate-500">Budget:</span> {l.budget ? formatShort(l.budget) : '—'}</p><p><span className="text-slate-500">Source:</span> {l.source}</p><p><span className="text-slate-500">Created:</span> {fmtDate(l.createdAt)}</p></div>
        <div className="flex flex-wrap gap-2"><a href={`tel:${l.phone.replace(/\s/g, '')}`} onClick={() => add.mutate({ type: 'call', text: 'Called the customer.' })} className="btn-navy"><Phone className="h-4 w-4" />Call</a><a href={whatsappLink(l.phone, `Hi ${l.name}, this is regarding your enquiry on TN HOMES.`)} target="_blank" rel="noreferrer" className="btn bg-[#25D366] text-white"><MessageCircle className="h-4 w-4" />WhatsApp</a></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Status" options={LEAD_STATUSES} value={l.status} onChange={(e) => status.mutate({ status: e.target.value })} />
          <Select label="Priority" options={['low', 'medium', 'high'].map((x) => ({ value: x, label: titleCase(x) }))} value={l.priority} onChange={(e) => status.mutate({ status: l.status, priority: e.target.value })} />
          <Input label="Next follow-up" type="date" defaultValue={l.nextFollowUp} onChange={(e) => status.mutate({ status: l.status, nextFollowUp: e.target.value })} />
        </div>
        <div><Textarea label="Add follow-up note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /><div className="mt-2 flex flex-wrap items-end gap-2"><Input label="Schedule next follow-up" type="date" value={follow} onChange={(e) => setFollow(e.target.value)} wrapperClassName="w-48" /><Button disabled={note.trim().length < 3} loading={add.isPending} onClick={() => add.mutate({ type: 'note', text: note.trim(), nextFollowUp: follow || undefined })}>Add note</Button></div></div>
        <div><h3 className="mb-2 text-sm font-bold">Activity history</h3><ul className="space-y-2 border-l-2 border-gold-200 pl-4">{l.activities.map((a) => <li key={a.id} className="text-sm"><span className="font-semibold capitalize">{a.type}</span> · {a.text}<span className="block text-xs text-slate-400">{a.by} · {fmtDateTime(a.createdAt)}</span></li>)}</ul></div>
      </div>}
    </Modal>
  )
}

export function AgentLeads({ mode = 'leads' }: { mode?: 'leads' | 'enquiries' | 'followups' }) {
  const titles = { leads: 'Assigned Leads', enquiries: 'Enquiries', followups: 'Follow-ups' }
  useSeo({ title: titles[mode] })
  const [status, setStatus] = useState('')
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState<Lead | null>(null)
  const dq = useDebounce(term)
  const q = useQuery({ queryKey: ['agent-leads', status, dq], queryFn: () => agentApi.leads({ status, q: dq }) })
  const today = new Date().toISOString().slice(0, 10)
  let rows = q.data ?? []
  if (mode === 'enquiries') rows = rows.filter((l) => ['new', 'contacted'].includes(l.status))
  if (mode === 'followups') rows = rows.filter((l) => l.nextFollowUp && !['converted', 'lost'].includes(l.status)).sort((a, b) => (a.nextFollowUp ?? '').localeCompare(b.nextFollowUp ?? ''))
  const cols: Column<Lead>[] = [
    { key: 'code', header: 'Lead ID' }, { key: 'name', header: 'Customer', render: (l) => <div><p className="font-semibold">{l.name}</p><p className="text-xs text-slate-500">{l.phone}</p></div> }, { key: 'propertyTitle', header: 'Interested property', render: (l) => <span className="line-clamp-1 max-w-[200px]">{l.propertyTitle ?? '—'}</span> },
    { key: 'budget', header: 'Budget', render: (l) => (l.budget ? formatShort(l.budget) : '—') }, { key: 'source', header: 'Source' }, { key: 'priority', header: 'Priority', render: (l) => <StatusBadge status={l.priority} /> }, { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
    { key: 'nextFollowUp', header: 'Next follow-up', render: (l) => l.nextFollowUp ? <span className={cx(l.nextFollowUp < today && !['converted', 'lost'].includes(l.status) && 'font-bold text-red-600')}>{fmtDate(l.nextFollowUp)}</span> : '—' },
    { key: 'a', header: '', render: (l) => <Button size="sm" variant="outline" onClick={() => setOpen(l)}>Open</Button> },
  ]
  return (<><PageHeader title={titles[mode]} subtitle="Only leads assigned to you are shown." actions={<>
    <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search leads" aria-label="Search leads" className="input !w-48" />
    {mode === 'leads' && <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="input !w-44"><option value="">All statuses</option>{LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>}</>} />
    <DataTable columns={cols} rows={rows} rowKey={(r) => r.id} loading={q.isLoading} onRowClick={setOpen} emptyTitle="No leads found" emptyMessage="New enquiries on your properties will appear here." />
    <LeadModal lead={open} onClose={() => setOpen(null)} /></>)
}

/* ---------- appointments & calendar ---------- */
export function AgentAppointments() {
  useSeo({ title: 'Site Visits' })
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['agent-appointments'], queryFn: agentApi.appointments })
  const props = useQuery({ queryKey: ['agent-properties', 'all'], queryFn: () => agentApi.properties({ perPage: 100 }) })
  const [modal, setModal] = useState(false)
  const [f, setF] = useState({ propertyId: '', customerName: '', phone: '', date: '', time: '11:00 AM' })
  const upd = useMutation({ mutationFn: ({ id, ...b }: { id: number } & Record<string, unknown>) => agentApi.updateAppointment(id, b), onSuccess: () => { toast.success('Visit updated'); void qc.invalidateQueries({ queryKey: ['agent-appointments'] }) }, onError: (e) => toast.error(parseApiError(e).message) })
  const create = useMutation({ mutationFn: () => agentApi.schedule(f), onSuccess: () => { toast.success('Visit scheduled'); setModal(false); void qc.invalidateQueries({ queryKey: ['agent-appointments'] }) }, onError: (e) => toast.error(parseApiError(e).message) })
  const cols: Column<Appointment>[] = [
    { key: 'code', header: 'ID' }, { key: 'customerName', header: 'Customer', render: (a) => <div><p className="font-semibold">{a.customerName}</p><p className="text-xs text-slate-500">{a.phone}</p></div> }, { key: 'propertyTitle', header: 'Property' }, { key: 'date', header: 'Date', render: (a) => fmtDate(a.date) }, { key: 'time', header: 'Time' },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    { key: 'actions', header: 'Actions', render: (a) => <div className="flex gap-1">{a.status === 'pending' && <Button size="sm" onClick={() => upd.mutate({ id: a.id, status: 'confirmed' })}>Confirm</Button>}{a.status === 'confirmed' && <Button size="sm" variant="navy" onClick={() => upd.mutate({ id: a.id, status: 'completed' })}>Complete</Button>}{['pending', 'confirmed'].includes(a.status) && <Button size="sm" variant="ghost" onClick={() => upd.mutate({ id: a.id, status: 'cancelled' })}>Cancel</Button>}</div> },
  ]
  const valid = f.propertyId && f.customerName.trim().length > 1 && f.date && /^[+]?[0-9\s-]{10,15}$/.test(f.phone)
  return (<><PageHeader title="Site Visits" subtitle="Confirm, complete or schedule property visits." actions={<Button onClick={() => setModal(true)}>+ Schedule visit</Button>} />
    <DataTable columns={cols} rows={q.data ?? []} rowKey={(r) => r.id} loading={q.isLoading} emptyTitle="No site visits scheduled" />
    <Modal open={modal} onClose={() => setModal(false)} title="Schedule site visit" footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button disabled={!valid} loading={create.isPending} onClick={() => create.mutate()}>Schedule</Button></>}>
      <div className="space-y-3"><Select label="Property" required placeholder="Select property" options={(props.data?.data ?? []).map((p) => ({ value: p.id, label: `${p.code} – ${p.title}` }))} value={f.propertyId} onChange={(e) => setF({ ...f, propertyId: e.target.value })} />
        <Input label="Customer name" required value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} /><Input label="Customer phone" required type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <div className="grid grid-cols-2 gap-3"><Input label="Date" required type="date" min={new Date().toISOString().slice(0, 10)} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /><Select label="Time" options={['10:00 AM', '11:00 AM', '12:00 PM', '03:00 PM', '04:30 PM', '06:00 PM']} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div></div>
    </Modal></>)
}

export function AgentCalendar() {
  useSeo({ title: 'Calendar' })
  const [month, setMonth] = useState(new Date())
  const [sel, setSel] = useState<Date | null>(new Date())
  const q = useQuery({ queryKey: ['agent-appointments'], queryFn: agentApi.appointments })
  const leads = useQuery({ queryKey: ['agent-leads', '', ''], queryFn: () => agentApi.leads() })
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) })
  const on = (d: Date) => (q.data ?? []).filter((a) => a.date === format(d, 'yyyy-MM-dd') && a.status !== 'cancelled')
  const fu = (d: Date) => (leads.data ?? []).filter((l) => l.nextFollowUp === format(d, 'yyyy-MM-dd') && !['converted', 'lost'].includes(l.status))
  return (<><PageHeader title="Calendar" subtitle="Site visits and follow-ups." />
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card p-4"><div className="mb-3 flex items-center justify-between"><button aria-label="Previous month" onClick={() => setMonth(subMonths(month, 1))} className="rounded-lg p-2 hover:bg-slate-100"><ChevronLeft className="h-5 w-5" /></button><h2 className="font-bold">{format(month, 'MMMM yyyy')}</h2><button aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))} className="rounded-lg p-2 hover:bg-slate-100"><ChevronRight className="h-5 w-5" /></button></div>
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-2">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">{days.map((d) => { const a = on(d).length, f = fu(d).length; return <button key={d.toISOString()} onClick={() => setSel(d)} aria-label={`${format(d, 'd MMMM')}: ${a} visits, ${f} follow-ups`} className={cx('flex h-16 flex-col items-center rounded-lg border p-1 text-sm', isSameMonth(d, month) ? 'bg-white' : 'bg-slate-50 text-slate-400', sel && isSameDay(d, sel) ? 'border-gold ring-2 ring-gold/30' : 'border-slate-100 hover:border-gold-200', isSameDay(d, new Date()) && 'font-extrabold text-gold-600')}>{format(d, 'd')}<span className="mt-auto flex gap-1">{a > 0 && <span className="h-2 w-2 rounded-full bg-brand-green" />}{f > 0 && <span className="h-2 w-2 rounded-full bg-gold" />}</span></button> })}</div>
        <p className="mt-3 flex gap-4 text-xs text-slate-500"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-green" />Site visit</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gold" />Follow-up</span></p></div>
      <div className="card h-fit p-4"><h3 className="mb-3 font-bold">{sel ? format(sel, 'EEEE, d MMM yyyy') : 'Select a day'}</h3>{sel && (on(sel).length + fu(sel).length === 0 ? <p className="text-sm text-slate-500">Nothing scheduled.</p> : <ul className="space-y-3 text-sm">{on(sel).map((a) => <li key={a.id} className="rounded-lg bg-green-50 p-3"><p className="font-semibold">{a.time} · {a.customerName}</p><p className="text-xs text-slate-600">{a.propertyTitle}</p><StatusBadge status={a.status} className="mt-1" /></li>)}{fu(sel).map((l) => <li key={l.id} className="rounded-lg bg-gold-50 p-3"><p className="font-semibold">Follow up: {l.name}</p><p className="text-xs text-slate-600">{l.propertyTitle}</p></li>)}</ul>)}</div>
    </div></>)
}

export function AgentReports() {
  useSeo({ title: 'Performance' })
  const q = useQuery({ queryKey: ['agent-reports'], queryFn: agentApi.reports })
  const d = q.data
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />
  return (<><PageHeader title="Performance" subtitle="Your personal lead and listing metrics." />
    <div className="grid gap-4 sm:grid-cols-3">{!d ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24" />) : <><StatCard label="Conversion rate" value={`${d.conversionRate}%`} icon={<CheckCircle2 />} tone="green" /><StatCard label="Total leads" value={d.totalLeads} icon={<Users />} tone="blue" /><StatCard label="Listing views" value={d.totalViews.toLocaleString('en-IN')} icon={<Building2 />} tone="gold" /></>}</div>
    {d && <div className="mt-6 grid gap-6 lg:grid-cols-2"><ChartCard title="Leads by month"><LineSeries data={d.monthly} keys={[{ key: 'leads', name: 'New leads', color: '#052442' }, { key: 'converted', name: 'Converted', color: '#088E4C' }]} /></ChartCard>
      <ChartCard title="Lead status mix"><DonutChart data={d.funnel.filter((f) => f.count).map((f) => ({ name: titleCase(f.status), value: f.count }))} /></ChartCard>
      <div className="card p-4 lg:col-span-2"><h3 className="mb-3 text-sm font-bold">Top performing listings</h3>{d.topProperties.length ? <ul className="divide-y">{d.topProperties.map((p) => <li key={p.title} className="flex justify-between py-2 text-sm"><span>{p.title} <span className="text-xs text-slate-500">· {p.city}</span></span><b>{p.views.toLocaleString('en-IN')} views</b></li>)}</ul> : <EmptyState title="No listings yet" />}</div></div>}</>)
}
