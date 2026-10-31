import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, CalendarCheck, CheckCircle2, IndianRupee, MessageSquare, Pencil, ShieldAlert, Trash2, Upload, UserCog, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Button, ConfirmDialog, DataTable, ErrorState, Input, Modal, Skeleton, StatCard, StatusBadge, Textarea } from '@/components/common'
import type { Column } from '@/components/common'
import { BarSeries, ChartCard, DonutChart, LineSeries } from '@/components/dashboard/Charts'
import PageHeader from '@/components/dashboard/PageHeader'
import ResourcePage from '@/components/dashboard/ResourcePage'
import PropertyForm from '@/components/property/PropertyForm'
import { useDebounce } from '@/hooks/useDebounce'
import { useSeo } from '@/hooks/useSeo'
import { adminApi } from '@/services/api'
import { parseApiError, USE_MOCK } from '@/services/http'
import type { Agent, Appointment, AuditLog, Banner, Blog, Category, Enquiry, Lead, Location, MediaFile, NotificationItem, Payment, Project, Property, Review, RoleDef, SellRentRequest, User } from '@/types'
import { LEAD_STATUSES } from '@/utils/constants'
import { fmtDate, fmtDateTime, formatINR, formatShort, priceLabel, timeAgo, titleCase } from '@/utils/format'

const thumb = (src: string) => <img src={src} alt="" className="h-10 w-14 rounded object-cover" />
const bool = (v: boolean) => <StatusBadge status={v ? 'active' : 'inactive'} />

/* ---------------- dashboard ---------------- */
export function AdminDashboard() {
  useSeo({ title: 'Admin Dashboard' })
  const q = useQuery({ queryKey: ['admin-dashboard'], queryFn: adminApi.dashboard })
  const qc = useQueryClient()
  const d = q.data
  const approve = useMutation({ mutationFn: adminApi.approve, onSuccess: () => { toast.success('Property approved'); void qc.invalidateQueries({ queryKey: ['admin-dashboard'] }) } })
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} message={parseApiError(q.error).message} />
  return (<>
    <PageHeader title="Dashboard" subtitle="Live overview of your real estate business." actions={<Link to="/admin/properties/new" className="btn-primary">+ Add Property</Link>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{!d ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-24" />) : <>
      <StatCard label="Total properties" value={d.totalProperties} icon={<Building2 />} hint={`${d.activeProperties} active`} /><StatCard label="Pending approval" value={d.pendingApproval} icon={<ShieldAlert />} tone="gold" />
      <StatCard label="Agents" value={d.agents} icon={<UserCog />} tone="blue" /><StatCard label="Customers" value={d.customers} icon={<Users />} tone="green" />
      <StatCard label="Enquiries" value={d.enquiries} icon={<MessageSquare />} hint={`${d.openEnquiries} unassigned`} /><StatCard label="Site visits" value={d.appointments} icon={<CalendarCheck />} tone="blue" />
      <StatCard label="Converted leads" value={d.converted} icon={<CheckCircle2 />} tone="green" /><StatCard label="Revenue (paid)" value={formatINR(d.revenue)} icon={<IndianRupee />} tone="gold" /></>}</div>
    {d && <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <ChartCard title="Enquiries, listings & visits (6 months)"><LineSeries data={d.monthly} keys={[{ key: 'enquiries', name: 'Enquiries', color: '#052442' }, { key: 'properties', name: 'New listings', color: '#C9962B' }, { key: 'visits', name: 'Visits', color: '#088E4C' }]} /></ChartCard>
      <div className="card p-4"><h3 className="mb-3 text-sm font-bold">Awaiting approval</h3>{d.pending.length ? <ul className="divide-y">{d.pending.map((p) => <li key={p.id} className="flex items-center justify-between gap-2 py-2.5 text-sm"><span className="min-w-0"><Link to={`/admin/properties/${p.id}/edit`} className="line-clamp-1 font-semibold hover:text-gold-600">{p.title}</Link><span className="text-xs text-slate-500">{p.code} · {p.city}</span></span><Button size="sm" loading={approve.isPending && approve.variables === p.id} onClick={() => approve.mutate(p.id)}>Approve</Button></li>)}</ul> : <p className="py-8 text-center text-sm text-slate-500">No properties awaiting approval.</p>}</div>
      <div className="card p-4 lg:col-span-2"><div className="mb-3 flex justify-between"><h3 className="text-sm font-bold">Recent enquiries</h3><Link to="/admin/enquiries" className="text-xs font-semibold text-gold-600">View all</Link></div><ul className="divide-y">{d.recentEnquiries.map((e) => <li key={e.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span><b>{e.name}</b> · {e.propertyTitle ?? 'General'}</span><span className="text-xs text-slate-500">{timeAgo(e.createdAt)}</span></li>)}</ul></div>
    </div>}
  </>)
}

/* ---------------- properties ---------------- */
export function AdminProperties() {
  useSeo({ title: 'Admin – Properties' })
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [term, setTerm] = useState('')
  const [verification, setV] = useState('')
  const [listing, setL] = useState('')
  const [del, setDel] = useState<Property | null>(null)
  const [rej, setRej] = useState<Property | null>(null)
  const [reason, setReason] = useState('')
  const dq = useDebounce(term)
  const q = useQuery({ queryKey: ['admin-properties', page, dq, verification, listing], queryFn: () => adminApi.properties({ page, q: dq, verification, listing }), placeholderData: (p) => p })
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['admin-properties'] }); void qc.invalidateQueries({ queryKey: ['admin-dashboard'] }) }
  const ok = (msg: string) => () => { toast.success(msg); refresh() }
  const err = (e: unknown) => toast.error(parseApiError(e).message)
  const approve = useMutation({ mutationFn: adminApi.approve, onSuccess: ok('Property approved'), onError: err })
  const reject = useMutation({ mutationFn: () => adminApi.reject(rej!.id, reason), onSuccess: () => { toast.success('Property rejected'); setRej(null); setReason(''); refresh() }, onError: err })
  const remove = useMutation({ mutationFn: (id: number) => adminApi.deleteProperty(id), onSuccess: () => { toast.success('Deleted'); setDel(null); refresh() }, onError: err })
  const cols: Column<Property>[] = [
    { key: 'title', header: 'Property', render: (p) => <div className="flex items-center gap-3"><img src={p.images[0]} alt="" className="h-12 w-16 rounded object-cover" /><div><Link to={`/property/${p.slug}`} className="line-clamp-1 font-semibold hover:text-gold-600">{p.title}</Link><p className="text-xs text-slate-500">{p.code} · {p.locality}, {p.city}</p></div></div> },
    { key: 'price', header: 'Price', render: (p) => priceLabel(p) }, { key: 'purpose', header: 'Purpose', render: (p) => titleCase(p.purpose) }, { key: 'verification', header: 'Verification', render: (p) => <StatusBadge status={p.verification} /> }, { key: 'listing', header: 'Listing', render: (p) => <StatusBadge status={p.listing} /> }, { key: 'views', header: 'Views' },
    { key: 'a', header: 'Actions', render: (p) => <div className="flex items-center gap-1">{p.verification !== 'verified' && <Button size="sm" onClick={() => approve.mutate(p.id)}>Approve</Button>}{p.verification !== 'rejected' && <Button size="sm" variant="ghost" onClick={() => setRej(p)}>Reject</Button>}
      <Link to={`/admin/properties/${p.id}/edit`} aria-label="Edit" className="rounded-lg p-2 text-navy-500 hover:bg-navy-50"><Pencil className="h-4 w-4" /></Link><button aria-label="Delete" onClick={() => setDel(p)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div> },
  ]
  return (<><PageHeader title="Properties" subtitle="Review, approve and manage every listing." actions={<>
    <input value={term} onChange={(e) => { setTerm(e.target.value); setPage(1) }} placeholder="Search properties" aria-label="Search properties" className="input !w-52" />
    <select aria-label="Verification" value={verification} onChange={(e) => { setV(e.target.value); setPage(1) }} className="input !w-40"><option value="">Verification</option>{['pending', 'verified', 'rejected'].map((x) => <option key={x} value={x}>{titleCase(x)}</option>)}</select>
    <select aria-label="Listing" value={listing} onChange={(e) => { setL(e.target.value); setPage(1) }} className="input !w-36"><option value="">Listing</option>{['draft', 'active', 'inactive', 'sold', 'rented', 'expired'].map((x) => <option key={x} value={x}>{titleCase(x)}</option>)}</select>
    <Link to="/admin/properties/new" className="btn-primary">+ Add Property</Link></>} />
    <DataTable columns={cols} rows={q.data?.data ?? []} rowKey={(r) => r.id} loading={q.isLoading} meta={q.data?.meta} onPage={setPage} />
    <Modal open={!!rej} onClose={() => setRej(null)} title="Reject property" size="sm" footer={<><Button variant="ghost" onClick={() => setRej(null)}>Cancel</Button><Button variant="danger" loading={reject.isPending} onClick={() => reject.mutate()}>Reject</Button></>}><Textarea label="Reason (sent to the agent)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Modal>
    <ConfirmDialog open={!!del} message={`Delete "${del?.title}" permanently?`} confirmLabel="Delete" loading={remove.isPending} onConfirm={() => del && remove.mutate(del.id)} onCancel={() => setDel(null)} /></>)
}

export function AdminPropertyForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const qc = useQueryClient()
  useSeo({ title: id ? 'Admin – Edit Property' : 'Admin – Add Property' })
  const agents = useQuery({ queryKey: ['admin', 'agents', 'all'], queryFn: () => adminApi.list<Agent>('agents', { perPage: 100 }) })
  const prop = useQuery({ queryKey: ['admin-property', id], queryFn: () => adminApi.property(Number(id)), enabled: !!id })
  if (id && prop.isLoading) return <Skeleton className="h-96" />
  if (id && prop.isError) return <ErrorState message="Property not found." />
  return (<><PageHeader title={id ? 'Edit Property' : 'Add Property'} subtitle={prop.data?.code ?? 'Admin-created listings are verified automatically unless you change the status.'} />
    <PropertyForm mode="admin" property={prop.data} agents={agents.data?.data ?? []} submitLabel={id ? 'Save Changes' : 'Create Property'} onSubmit={async (b) => { const r = id ? await adminApi.updateProperty(Number(id), b) : await adminApi.createProperty(b); toast.success(id ? 'Property updated' : 'Property created'); await qc.invalidateQueries({ queryKey: ['admin-properties'] }); nav('/admin/properties'); return r }} /></>)
}

/* ---------------- shared helpers ---------------- */
function StatusSelect({ value, options, onChange, label }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; label: string }) {
  return <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="input !w-auto !py-1.5 !text-xs">{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
}
function useStatusUpdate(resource: string) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, ...b }: { id: number } & Record<string, unknown>) => adminApi.update(resource, id, b), onSuccess: () => { toast.success('Updated'); void qc.invalidateQueries({ queryKey: ['admin', resource] }) }, onError: (e) => toast.error(parseApiError(e).message) })
}
function AssignAgent({ onAssign, current }: { onAssign: (agentId: number) => Promise<unknown>; current?: number | null }) {
  const agents = useQuery({ queryKey: ['admin', 'agents', 'all'], queryFn: () => adminApi.list<Agent>('agents', { perPage: 100 }), staleTime: 60000 })
  const [busy, setBusy] = useState(false)
  return <select aria-label="Assign agent" disabled={busy} value={current ?? ''} onChange={async (e) => { if (!e.target.value) return; setBusy(true); try { await onAssign(Number(e.target.value)); toast.success('Assigned') } catch (er) { toast.error(parseApiError(er).message) } finally { setBusy(false) } }} className="input !w-40 !py-1.5 !text-xs"><option value="">Assign agent…</option>{(agents.data?.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
}

/* ---------------- resource pages ---------------- */
export function AdminCategories() {
  return <ResourcePage<Category & { id: number }> resource="categories" title="Property Categories" createLabel="Add category" defaults={{ group: 'residential', active: true, image: '/images/ph-house.svg' }}
    columns={[{ key: 'image', header: '', render: (c) => thumb(c.image) }, { key: 'name', header: 'Name' }, { key: 'group', header: 'Group', render: (c) => titleCase(c.group) }, { key: 'description', header: 'Description' }, { key: 'active', header: 'Status', render: (c) => bool(c.active) }]}
    fields={[{ name: 'name', label: 'Name', required: true }, { name: 'group', label: 'Group', type: 'select', options: ['residential', 'commercial', 'land'], required: true }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'image', label: 'Image', type: 'image' }, { name: 'active', label: 'Active', type: 'checkbox' }]} />
}
export function AdminLocations() {
  const all = useQuery({ queryKey: ['admin', 'locations', 'all'], queryFn: () => adminApi.list<Location>('locations', { perPage: 100 }) })
  const rows = all.data?.data ?? []
  const name = (id: number | null) => rows.find((l) => l.id === id)?.name ?? '—'
  return <ResourcePage<Location & { id: number }> resource="locations" title="Locations" subtitle="State → District → City → Town → Locality hierarchy used across the site." createLabel="Add location" searchPlaceholder="Search locations" defaults={{ type: 'locality', active: true }}
    filters={[{ name: 'type', label: 'Type', options: ['state', 'district', 'city', 'town', 'locality'] }]}
    columns={[{ key: 'name', header: 'Name', render: (l) => <span><b>{l.name}</b>{l.nameTa && <span className="ml-2 text-xs text-slate-500">{l.nameTa}</span>}</span> }, { key: 'type', header: 'Type', render: (l) => titleCase(l.type) }, { key: 'parentId', header: 'Parent', render: (l) => name(l.parentId) }, { key: 'pincode', header: 'PIN code' }, { key: 'active', header: 'Status', render: (l) => bool(l.active) }]}
    fields={[{ name: 'name', label: 'Name', required: true }, { name: 'nameTa', label: 'Name (Tamil)' }, { name: 'type', label: 'Type', type: 'select', options: ['state', 'district', 'city', 'town', 'locality'], required: true }, { name: 'parentId', label: 'Parent location', type: 'select', numeric: true, options: rows.map((l) => ({ value: l.id, label: `${l.name} (${l.type})` })) }, { name: 'pincode', label: 'PIN code' }, { name: 'active', label: 'Active', type: 'checkbox' }]} />
}
export function AdminProjects() {
  return <ResourcePage<Project & { id: number }> resource="projects" title="Projects" createLabel="Add project" modalSize="lg" defaults={{ tag: 'New Launch', status: 'New Launch', active: true, image: '/images/villa-blue.webp' }}
    createFn={(b) => adminApi.create('projects', { gallery: [b.image], units: [{ type: String(b.configurations), area: '—', price: b.startingPrice }], possession: 'To be announced', ...b })}
    columns={[{ key: 'image', header: '', render: (p) => thumb(p.image) }, { key: 'name', header: 'Project', render: (p) => <div><p className="font-semibold">{p.name}</p><p className="text-xs text-slate-500">{p.builder}</p></div> }, { key: 'city', header: 'Location', render: (p) => `${p.locality}, ${p.city}` }, { key: 'startingPrice', header: 'From', render: (p) => formatShort(p.startingPrice) }, { key: 'status', header: 'Status' }, { key: 'rera', header: 'RERA' }, { key: 'active', header: 'Visible', render: (p) => bool(p.active) }]}
    fields={[{ name: 'name', label: 'Project name', required: true }, { name: 'builder', label: 'Builder / developer', required: true }, { name: 'city', label: 'City', required: true }, { name: 'locality', label: 'Locality', required: true }, { name: 'tag', label: 'Tag', type: 'select', options: ['New Launch', 'Featured', 'Popular', 'Premium'] }, { name: 'status', label: 'Status', type: 'select', options: ['New Launch', 'Under Construction', 'Ready to Move'] }, { name: 'startingPrice', label: 'Starting price (₹)', type: 'number', required: true, min: 0 }, { name: 'configurations', label: 'Configurations', required: true }, { name: 'rera', label: 'RERA number', required: true }, { name: 'possession', label: 'Possession' }, { name: 'amenities', label: 'Amenities (comma separated)', type: 'tags', full: true }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'image', label: 'Cover image', type: 'image' }, { name: 'active', label: 'Visible on website', type: 'checkbox' }]} />
}
export function AdminAgents() {
  return <ResourcePage<Agent & { id: number }> resource="agents" title="Agents" createLabel="Create agent" modalSize="lg" defaults={{ languages: ['Tamil', 'English'] }} createFn={(b) => adminApi.createAgent(b)}
    columns={[{ key: 'name', header: 'Agent', render: (a) => <div><p className="font-semibold">{a.name}</p><p className="text-xs text-slate-500">{a.email}</p></div> }, { key: 'phone', header: 'Phone' }, { key: 'city', header: 'City' }, { key: 'specialization', header: 'Specialization' }, { key: 'experienceYears', header: 'Exp.', render: (a) => `${a.experienceYears} yrs` }, { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> }]}
    fields={[{ name: 'name', label: 'Full name', required: true }, { name: 'email', label: 'Email', type: 'email', required: true, createOnly: true }, { name: 'phone', label: 'Phone', type: 'tel', required: true }, { name: 'password', label: 'Temporary password', type: 'password', createOnly: true, hint: 'Defaults to Agent@123 if left blank' }, { name: 'city', label: 'City' }, { name: 'specialization', label: 'Specialization' }, { name: 'experienceYears', label: 'Experience (years)', type: 'number', min: 0 }, { name: 'reraId', label: 'RERA agent ID' }, { name: 'languages', label: 'Languages (comma separated)', type: 'tags' }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }, { name: 'bio', label: 'Bio', type: 'textarea' }]} />
}
export function AdminCustomers() {
  const upd = useStatusUpdate('users')
  return <ResourcePage<User & { id: number }> resource="users" title="Customers" fixedQuery={{ role: 'customer' }} createLabel="Add customer" defaults={{ role: 'customer', status: 'active' }}
    columns={[{ key: 'name', header: 'Customer', render: (u) => <div><p className="font-semibold">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div> }, { key: 'phone', header: 'Phone' }, { key: 'city', header: 'City' }, { key: 'createdAt', header: 'Joined', render: (u) => fmtDate(u.createdAt) }, { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> }]}
    rowActions={(u) => <Button size="sm" variant="ghost" onClick={() => upd.mutate({ id: u.id, status: u.status === 'active' ? 'blocked' : 'active' })}>{u.status === 'active' ? 'Block' : 'Unblock'}</Button>}
    fields={[{ name: 'name', label: 'Full name', required: true }, { name: 'email', label: 'Email', type: 'email', required: true, createOnly: true }, { name: 'phone', label: 'Phone', type: 'tel' }, { name: 'city', label: 'City' }, { name: 'password', label: 'Temporary password', type: 'password', createOnly: true, hint: 'Defaults to Welcome@123' }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'blocked'] }]} />
}
export function AdminEnquiries() {
  return <ResourcePage<Enquiry & { id: number }> resource="enquiries" title="Enquiries" subtitle="Assign customer enquiries to agents." canCreate={false} canEdit={false} filters={[{ name: 'status', label: 'Status', options: ['open', 'assigned', 'closed'] }]} searchPlaceholder="Search enquiries"
    columns={[{ key: 'code', header: 'ID' }, { key: 'name', header: 'Customer', render: (e) => <div><p className="font-semibold">{e.name}</p><p className="text-xs text-slate-500">{e.phone}</p></div> }, { key: 'propertyTitle', header: 'Property', render: (e) => e.propertyTitle ?? 'General' }, { key: 'message', header: 'Message', render: (e) => <span className="line-clamp-1 max-w-[220px]">{e.message}</span> }, { key: 'source', header: 'Source' }, { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> }, { key: 'createdAt', header: 'Date', render: (e) => fmtDate(e.createdAt) }]}
    rowActions={(e, refresh) => <AssignAgent current={e.assignedAgentId} onAssign={async (id) => { await adminApi.assignEnquiry(e.id, id); refresh() }} />} />
}
export function AdminLeads() {
  return <ResourcePage<Lead & { id: number }> resource="leads" title="CRM and Leads" subtitle="Pipeline across all agents. Reassign leads when needed." canCreate={false} canEdit={false} canDelete={false} filters={[{ name: 'status', label: 'Status', options: LEAD_STATUSES }]} searchPlaceholder="Search leads"
    columns={[{ key: 'code', header: 'Lead' }, { key: 'name', header: 'Customer', render: (l) => <div><p className="font-semibold">{l.name}</p><p className="text-xs text-slate-500">{l.phone}</p></div> }, { key: 'propertyTitle', header: 'Property', render: (l) => l.propertyTitle ?? '—' }, { key: 'budget', header: 'Budget', render: (l) => (l.budget ? formatShort(l.budget) : '—') }, { key: 'priority', header: 'Priority', render: (l) => <StatusBadge status={l.priority} /> }, { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> }, { key: 'nextFollowUp', header: 'Follow-up', render: (l) => (l.nextFollowUp ? fmtDate(l.nextFollowUp) : '—') }]}
    rowActions={(l, refresh) => <AssignAgent current={l.agentId} onAssign={async (id) => { await adminApi.assignLead(l.id, id); refresh() }} />} />
}
export function AdminAppointments() {
  const upd = useStatusUpdate('appointments')
  return <ResourcePage<Appointment & { id: number }> resource="appointments" title="Appointments" canCreate={false} canEdit={false} filters={[{ name: 'status', label: 'Status', options: ['pending', 'confirmed', 'completed', 'cancelled'] }]} searchPlaceholder="Search appointments"
    columns={[{ key: 'code', header: 'ID' }, { key: 'customerName', header: 'Customer' }, { key: 'propertyTitle', header: 'Property' }, { key: 'date', header: 'Date', render: (a) => `${fmtDate(a.date)} · ${a.time}` }, { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> }]}
    rowActions={(a) => <StatusSelect label="Change status" value={a.status} onChange={(v) => upd.mutate({ id: a.id, status: v })} options={['pending', 'confirmed', 'completed', 'cancelled'].map((x) => ({ value: x, label: titleCase(x) }))} />} />
}
export function AdminSellRequests() {
  const upd = useStatusUpdate('sell-rent-requests')
  return <ResourcePage<SellRentRequest & { id: number }> resource="sell-rent-requests" title="Sell/Rent Requests" canCreate={false} canEdit={false} filters={[{ name: 'status', label: 'Status', options: ['new', 'reviewing', 'approved', 'rejected'] }]}
    columns={[{ key: 'code', header: 'ID' }, { key: 'name', header: 'Owner', render: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-slate-500">{r.phone}</p></div> }, { key: 'purpose', header: 'Purpose', render: (r) => titleCase(r.purpose) }, { key: 'type', header: 'Type' }, { key: 'city', header: 'Location', render: (r) => `${r.locality}, ${r.city}` }, { key: 'expectedPrice', header: 'Expected', render: (r) => formatINR(r.expectedPrice) }, { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> }]}
    rowActions={(r) => <StatusSelect label="Change status" value={r.status} onChange={(v) => upd.mutate({ id: r.id, status: v })} options={['new', 'reviewing', 'approved', 'rejected'].map((x) => ({ value: x, label: titleCase(x) }))} />} />
}
export function AdminReviews() {
  const upd = useStatusUpdate('reviews')
  return <ResourcePage<Review & { id: number }> resource="reviews" title="Reviews" subtitle="Moderate customer testimonials shown on the website." createLabel="Add review" defaults={{ rating: 5, status: 'published' }} filters={[{ name: 'status', label: 'Status', options: ['pending', 'published', 'hidden'] }]}
    columns={[{ key: 'name', header: 'Customer', render: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-slate-500">{r.city}</p></div> }, { key: 'rating', header: 'Rating', render: (r) => `${r.rating} ★` }, { key: 'text', header: 'Review', render: (r) => <span className="line-clamp-2 max-w-sm">{r.text}</span> }, { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> }]}
    rowActions={(r) => <StatusSelect label="Moderate" value={r.status} onChange={(v) => upd.mutate({ id: r.id, status: v })} options={['pending', 'published', 'hidden'].map((x) => ({ value: x, label: titleCase(x) }))} />}
    fields={[{ name: 'name', label: 'Customer name', required: true }, { name: 'city', label: 'City' }, { name: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, required: true }, { name: 'status', label: 'Status', type: 'select', options: ['pending', 'published', 'hidden'] }, { name: 'text', label: 'Review text', type: 'textarea', required: true }]} />
}
export function AdminBlogs() {
  return <ResourcePage<Blog & { id: number }> resource="blogs" title="Blog" createLabel="New article" modalSize="lg" defaults={{ published: true, author: 'TN HOMES Editorial', category: 'Guides', image: '/images/ph-house.svg' }}
    columns={[{ key: 'image', header: '', render: (b) => thumb(b.image) }, { key: 'title', header: 'Title', render: (b) => <span className="line-clamp-1 max-w-sm font-semibold">{b.title}</span> }, { key: 'category', header: 'Category' }, { key: 'author', header: 'Author' }, { key: 'createdAt', header: 'Date', render: (b) => fmtDate(b.createdAt) }, { key: 'published', header: 'Status', render: (b) => <StatusBadge status={b.published ? 'published' : 'draft'} /> }]}
    fields={[{ name: 'title', label: 'Title', required: true, full: true }, { name: 'category', label: 'Category', required: true }, { name: 'author', label: 'Author' }, { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true }, { name: 'content', label: 'Content (separate paragraphs with a blank line)', type: 'textarea', required: true }, { name: 'image', label: 'Cover image', type: 'image' }, { name: 'published', label: 'Published', type: 'checkbox' }]} />
}
export function AdminBanners() {
  return <ResourcePage<Banner & { id: number }> resource="banners" title="Banners" createLabel="Add banner" defaults={{ active: true, link: '/buy' }}
    columns={[{ key: 'image', header: '', render: (b) => thumb(b.image) }, { key: 'title', header: 'Title', render: (b) => <div><p className="font-semibold">{b.title}</p><p className="text-xs text-slate-500">{b.subtitle}</p></div> }, { key: 'link', header: 'Link' }, { key: 'active', header: 'Status', render: (b) => bool(b.active) }]}
    fields={[{ name: 'title', label: 'Title', required: true }, { name: 'subtitle', label: 'Subtitle' }, { name: 'link', label: 'Link (internal path)', required: true }, { name: 'image', label: 'Image', type: 'image' }, { name: 'active', label: 'Active', type: 'checkbox' }]} />
}
export function AdminMedia() {
  const qc = useQueryClient()
  const up = useMutation({ mutationFn: (b: Record<string, unknown>) => adminApi.create('media', b), onSuccess: () => { toast.success('Uploaded'); void qc.invalidateQueries({ queryKey: ['admin', 'media'] }) }, onError: (e) => toast.error(parseApiError(e).message) })
  const pick = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((f) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return void toast.error(`${f.name}: unsupported type`)
      if (f.size > 5 * 1024 * 1024) return void toast.error(`${f.name}: larger than 5 MB`)
      const r = new FileReader(); r.onload = () => up.mutate({ name: f.name, url: String(r.result), size: f.size, type: f.type }); r.readAsDataURL(f)
    })
  }
  return <ResourcePage<MediaFile & { id: number }> resource="media" title="Media Library" canCreate={false} canEdit={false}
    extraActions={<label className="btn-primary cursor-pointer"><Upload className="h-4 w-4" />Upload<input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = '' }} /></label>}
    columns={[{ key: 'url', header: 'Preview', render: (m) => thumb(m.url) }, { key: 'name', header: 'File' }, { key: 'type', header: 'Type' }, { key: 'size', header: 'Size', render: (m) => `${Math.round(m.size / 1024)} KB` }, { key: 'createdAt', header: 'Uploaded', render: (m) => fmtDate(m.createdAt) }]} />
}
export function AdminNotifications() {
  return <ResourcePage<NotificationItem & { id: number }> resource="notifications" title="Notifications" subtitle="System notifications sent to your account." canCreate={false} canEdit={false}
    columns={[{ key: 'title', header: 'Title', render: (n) => <b>{n.title}</b> }, { key: 'body', header: 'Message' }, { key: 'read', header: 'Status', render: (n) => <StatusBadge status={n.read ? 'closed' : 'new'} label={n.read ? 'Read' : 'Unread'} /> }, { key: 'createdAt', header: 'When', render: (n) => timeAgo(n.createdAt) }]} />
}
export function AdminPayments() {
  return <ResourcePage<Payment & { id: number }> resource="payments" title="Payments" canCreate={false} canEdit={false} canDelete={false} filters={[{ name: 'status', label: 'Status', options: ['paid', 'pending', 'failed', 'refunded'] }]}
    columns={[{ key: 'code', header: 'Payment' }, { key: 'userName', header: 'Customer' }, { key: 'purpose', header: 'Purpose' }, { key: 'amount', header: 'Amount', render: (p) => formatINR(p.amount) }, { key: 'method', header: 'Method' }, { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> }, { key: 'createdAt', header: 'Date', render: (p) => fmtDate(p.createdAt) }]} />
}
export function AdminRoles() {
  return <ResourcePage<RoleDef & { id: number }> resource="roles" title="Roles and Permissions" subtitle="Permissions are enforced on the server; the UI only mirrors them." createLabel="Add role" canDelete={false} defaults={{ permissions: [] }}
    columns={[{ key: 'name', header: 'Role', render: (r) => <b>{r.name}</b> }, { key: 'permissions', header: 'Permissions', render: (r) => <div className="flex flex-wrap gap-1">{r.permissions.map((p) => <span key={p} className="rounded bg-navy-50 px-2 py-0.5 text-xs text-navy-600">{p}</span>)}</div> }]}
    fields={[{ name: 'name', label: 'Role name', required: true }, { name: 'permissions', label: 'Permissions (comma separated)', type: 'tags', full: true, hint: 'e.g. properties.create, leads.view.own' }]} />
}
export function AdminAuditLogs() {
  return <ResourcePage<AuditLog & { id: number }> resource="audit-logs" title="Audit Logs" subtitle="Every important admin and agent action is recorded." canCreate={false} canEdit={false} canDelete={false} searchPlaceholder="Search logs"
    columns={[{ key: 'createdAt', header: 'Time', render: (l) => fmtDateTime(l.createdAt) }, { key: 'actor', header: 'User' }, { key: 'action', header: 'Action', render: (l) => <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{l.action}</code> }, { key: 'entity', header: 'Entity', render: (l) => `${l.entity}${l.entityId ? ` #${l.entityId}` : ''}` }, { key: 'ip', header: 'IP' }]} />
}

/* ---------------- reports ---------------- */
export function AdminReports() {
  useSeo({ title: 'Admin – Reports' })
  const q = useQuery({ queryKey: ['admin-reports'], queryFn: adminApi.reports })
  const d = q.data
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />
  return (<><PageHeader title="Reports" subtitle="Views, enquiries, appointments and conversions." />
    {!d ? <div className="grid gap-6 lg:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-72" />)}</div> : <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Traffic & enquiries"><LineSeries data={d.monthly.map((m) => ({ ...m, views: Math.round(m.views) }))} keys={[{ key: 'views', name: 'Property views', color: '#24558A' }, { key: 'enquiries', name: 'Enquiries', color: '#C9962B' }]} /></ChartCard>
      <ChartCard title="Appointments & conversions"><BarSeries x="month" data={d.monthly} keys={[{ key: 'appointments', name: 'Appointments', color: '#052442' }, { key: 'conversions', name: 'Conversions', color: '#088E4C' }]} /></ChartCard>
      <ChartCard title="Listings by city"><BarSeries horizontal data={d.byCity} keys={[{ key: 'value', name: 'Listings', color: '#C9962B' }]} /></ChartCard>
      <ChartCard title="Listings by type"><DonutChart data={d.byType} /></ChartCard>
      <ChartCard title="Lead funnel"><DonutChart data={d.leadFunnel.map((x) => ({ ...x, name: titleCase(x.name) }))} /></ChartCard>
      <ChartCard title="Agent performance"><BarSeries data={d.agentPerformance} keys={[{ key: 'leads', name: 'Leads', color: '#24558A' }, { key: 'converted', name: 'Converted', color: '#088E4C' }]} /></ChartCard>
      <div className="card p-4 lg:col-span-2"><h3 className="mb-3 text-sm font-bold">Most viewed properties</h3><ul className="divide-y">{d.topProperties.map((p) => <li key={p.id} className="flex justify-between py-2 text-sm"><span>{p.title} <span className="text-xs text-slate-500">· {p.code} · {p.city}</span></span><b>{p.views.toLocaleString('en-IN')}</b></li>)}</ul></div>
    </div>}</>)
}

/* ---------------- settings ---------------- */
const settingsSchema = z.object({
  siteName: z.string().min(2), tagline: z.string(), email: z.string().email('Enter a valid email'), phone: z.string().min(8, 'Enter a phone number'), whatsapp: z.string().regex(/^\d{10,15}$/, 'Digits only, with country code'), address: z.string(), hours: z.string(),
  requireVerification: z.boolean(), autoApproveAgentListings: z.boolean(), listingExpiryDays: z.string().refine((v) => Number(v) >= 1, 'Enter days'), gaId: z.string(), mapsKey: z.string(),
  facebook: z.string().url('Enter a URL'), instagram: z.string().url('Enter a URL'), youtube: z.string().url('Enter a URL'), linkedin: z.string().url('Enter a URL'),
})
type SV = z.infer<typeof settingsSchema>
export function AdminSettings() {
  useSeo({ title: 'Admin – Settings' })
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings })
  if (q.isLoading) return <Skeleton className="h-96" />
  if (!q.data) return <ErrorState />
  return <SettingsForm initial={q.data} onSaved={() => { void qc.invalidateQueries({ queryKey: ['settings'] }); void qc.invalidateQueries({ queryKey: ['admin-settings'] }) }} />
}
function SettingsForm({ initial: s, onSaved }: { initial: NonNullable<Awaited<ReturnType<typeof adminApi.settings>>>; onSaved: () => void }) {
  const [reset, setReset] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<SV>({ resolver: zodResolver(settingsSchema), defaultValues: { ...s, listingExpiryDays: String(s.listingExpiryDays), ...s.social } })
  const m = useMutation({ mutationFn: (v: SV) => adminApi.saveSettings({ siteName: v.siteName, tagline: v.tagline, email: v.email, phone: v.phone, whatsapp: v.whatsapp, address: v.address, hours: v.hours, requireVerification: v.requireVerification, autoApproveAgentListings: v.autoApproveAgentListings, listingExpiryDays: Number(v.listingExpiryDays), gaId: v.gaId, mapsKey: v.mapsKey, social: { facebook: v.facebook, instagram: v.instagram, youtube: v.youtube, linkedin: v.linkedin } }), onSuccess: () => { toast.success('Settings saved'); onSaved() }, onError: (e) => toast.error(parseApiError(e).message) })
  const wipe = useMutation({ mutationFn: adminApi.resetDemo, onSuccess: () => { toast.success('Demo data reset'); window.location.href = '/login' } })
  const e = (k: keyof SV) => errors[k]?.message
  return (<><PageHeader title="Settings" subtitle="Website, publishing rules and integrations." />
    <form onSubmit={handleSubmit((v) => m.mutate(v))} className="space-y-5" noValidate>
      <section className="card grid gap-4 p-5 sm:grid-cols-2"><h2 className="font-bold sm:col-span-2">General</h2><Input label="Site name" error={e('siteName')} {...register('siteName')} /><Input label="Tagline" {...register('tagline')} /><Input label="Support email" type="email" error={e('email')} {...register('email')} /><Input label="Phone" error={e('phone')} {...register('phone')} /><Input label="WhatsApp number" hint="Digits with country code, e.g. 919876543210" error={e('whatsapp')} {...register('whatsapp')} /><Input label="Working hours" {...register('hours')} /><Input wrapperClassName="sm:col-span-2" label="Address" {...register('address')} /></section>
      <section className="card grid gap-4 p-5 sm:grid-cols-2"><h2 className="font-bold sm:col-span-2">Publishing rules</h2>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-gold" {...register('requireVerification')} /><span><b>Require verification before listings are public</b><span className="block text-xs text-slate-500">Only verified, active listings appear on the website.</span></span></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-gold" {...register('autoApproveAgentListings')} /><span><b>Auto-verify agent listings</b><span className="block text-xs text-slate-500">Skip manual review for agent-submitted listings.</span></span></label>
        <Input label="Listing expiry (days)" type="number" min={1} error={e('listingExpiryDays')} {...register('listingExpiryDays')} /></section>
      <section className="card grid gap-4 p-5 sm:grid-cols-2"><h2 className="font-bold sm:col-span-2">Integrations</h2><Input label="Google Analytics ID" placeholder="G-XXXXXXXXXX" {...register('gaId')} /><Input label="Google Maps API key" hint="Public browser key, restricted by domain" {...register('mapsKey')} /></section>
      <section className="card grid gap-4 p-5 sm:grid-cols-2"><h2 className="font-bold sm:col-span-2">Social links</h2>{(['facebook', 'instagram', 'youtube', 'linkedin'] as const).map((k) => <Input key={k} label={titleCase(k)} error={e(k)} {...register(k)} />)}</section>
      <div className="flex flex-wrap justify-between gap-3"><Button type="submit" loading={m.isPending}>Save settings</Button>{USE_MOCK && <Button variant="outline" onClick={() => setReset(true)}>Reset demo data</Button>}</div>
    </form>
    <ConfirmDialog open={reset} message="This restores all demo records and signs you out. Use only in development." confirmLabel="Reset" loading={wipe.isPending} onConfirm={() => wipe.mutate()} onCancel={() => setReset(false)} /></>)
}
