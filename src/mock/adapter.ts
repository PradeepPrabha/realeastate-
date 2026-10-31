import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type {
  Agent, Appointment, AuditLog, Blog, Enquiry, Lead, NotificationItem, Paginated, Project, Property, PropertyFilters, Role, SavedSearch, SellRentRequest, User,
} from '@/types'
import { col, getDB, nextId, resetDB, saveDB } from './db'

/* ------------------------------------------------------------------ */
/* Mock REST backend implementing the /api/v1 contract used by the UI. */
/* Replace by setting VITE_USE_MOCK=false and pointing VITE_API_URL at */
/* the Laravel API – no UI code changes are required.                  */
/* ------------------------------------------------------------------ */

class HttpError extends Error {
  status: number
  errors?: Record<string, string[]>
  constructor(status: number, message: string, errors?: Record<string, string[]>) { super(message); this.status = status; this.errors = errors }
}
type Body = Record<string, unknown>
interface Ctx { method: string; path: string; query: Record<string, string>; body: Body; user: User | null; params: string[] }
type Handler = (c: Ctx) => unknown

const now = () => new Date().toISOString()
const num = (v: unknown, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d }
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const strip = (u: User) => u

function need(c: Ctx, ...roles: Role[]): User {
  if (!c.user) throw new HttpError(401, 'Unauthenticated.')
  if (roles.length && !roles.includes(c.user.role)) throw new HttpError(403, 'You do not have permission to perform this action.')
  return c.user
}
function required(b: Body, fields: string[]) {
  const errors: Record<string, string[]> = {}
  for (const f of fields) if (b[f] === undefined || b[f] === null || b[f] === '') errors[f] = [`The ${f} field is required.`]
  if (Object.keys(errors).length) throw new HttpError(422, 'The given data was invalid.', errors)
}
function audit(actor: string, action: string, entity: string, entityId?: number) {
  col<AuditLog>('audit-logs').unshift({ id: nextId('audit-logs'), actor, action, entity, entityId, ip: '127.0.0.1', createdAt: now() })
}
function notify(userId: number | undefined, title: string, body: string) {
  if (!userId) return
  col<NotificationItem>('notifications').unshift({ id: nextId('notifications'), userId, title, body, read: false, createdAt: now() })
}
function paginate<T>(list: T[], q: Record<string, string>, defaultPer = 10): Paginated<T> {
  const perPage = Math.min(100, Math.max(1, num(q.perPage, defaultPer)))
  const page = Math.max(1, num(q.page, 1))
  const total = list.length
  return { data: list.slice((page - 1) * perPage, page * perPage), meta: { page, perPage, total, lastPage: Math.max(1, Math.ceil(total / perPage)) } }
}
function searchList<T extends object>(list: T[], term: string | undefined, fields: string[]): T[] {
  if (!term) return list
  const t = term.toLowerCase()
  return list.filter((r) => fields.some((f) => str((r as Record<string, unknown>)[f]).toLowerCase().includes(t)))
}
const csv = (v?: string) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [])

/* ---------- property helpers ---------- */
const isPublic = (p: Property) => {
  const s = getDB().settings
  return p.listing === 'active' && (!s.requireVerification || p.verification === 'verified')
}
const effectivePrice = (p: Property) => (p.purpose === 'sale' ? p.price : p.rent ?? p.price)
function parseFilters(q: Record<string, string>): PropertyFilters {
  return {
    purpose: (q.purpose as PropertyFilters['purpose']) || undefined, group: (q.group as PropertyFilters['group']) || undefined, type: csv(q.type), city: q.city, district: q.district, locality: q.locality, q: q.q,
    minPrice: q.minPrice ? num(q.minPrice) : undefined, maxPrice: q.maxPrice ? num(q.maxPrice) : undefined, bedrooms: q.bedrooms ? num(q.bedrooms) : undefined, bathrooms: q.bathrooms ? num(q.bathrooms) : undefined,
    minArea: q.minArea ? num(q.minArea) : undefined, maxArea: q.maxArea ? num(q.maxArea) : undefined, facing: q.facing, furnishing: q.furnishing, construction: csv(q.construction), amenities: csv(q.amenities),
    rera: q.rera === 'true', featured: q.featured === 'true', verified: q.verified === 'true', sort: (q.sort as PropertyFilters['sort']) || 'latest',
  }
}
function applyFilters(list: Property[], f: PropertyFilters): Property[] {
  let r = list
  if (f.purpose) r = r.filter((p) => (f.purpose === 'rent' ? p.purpose === 'rent' || p.purpose === 'lease' : p.purpose === f.purpose))
  if (f.group) r = r.filter((p) => p.group === f.group)
  if (f.type?.length) r = r.filter((p) => f.type!.includes(p.type))
  if (f.city) r = r.filter((p) => csv(f.city).includes(p.city))
  if (f.district) r = r.filter((p) => p.district === f.district)
  if (f.locality) r = r.filter((p) => p.locality.toLowerCase().includes(f.locality!.toLowerCase()))
  if (f.q) { const t = f.q.toLowerCase(); r = r.filter((p) => [p.title, p.locality, p.city, p.code, p.type, p.district].some((x) => x.toLowerCase().includes(t))) }
  if (f.minPrice !== undefined) r = r.filter((p) => effectivePrice(p) >= f.minPrice!)
  if (f.maxPrice !== undefined) r = r.filter((p) => effectivePrice(p) <= f.maxPrice!)
  if (f.bedrooms !== undefined) r = r.filter((p) => (f.bedrooms! >= 5 ? p.bedrooms >= 5 : p.bedrooms === f.bedrooms))
  if (f.bathrooms !== undefined) r = r.filter((p) => p.bathrooms >= f.bathrooms!)
  if (f.minArea !== undefined) r = r.filter((p) => p.builtUpArea >= f.minArea!)
  if (f.maxArea !== undefined) r = r.filter((p) => p.builtUpArea <= f.maxArea!)
  if (f.facing) r = r.filter((p) => p.facing === f.facing)
  if (f.furnishing) r = r.filter((p) => p.furnishing === f.furnishing)
  if (f.construction?.length) r = r.filter((p) => f.construction!.includes(p.construction))
  if (f.amenities?.length) r = r.filter((p) => f.amenities!.every((a) => p.amenities.includes(a)))
  if (f.rera) r = r.filter((p) => !!p.rera)
  if (f.featured) r = r.filter((p) => p.featured)
  if (f.verified) r = r.filter((p) => p.verification === 'verified')
  const sorters: Record<string, (a: Property, b: Property) => number> = {
    latest: (a, b) => b.createdAt.localeCompare(a.createdAt), price_asc: (a, b) => effectivePrice(a) - effectivePrice(b),
    price_desc: (a, b) => effectivePrice(b) - effectivePrice(a), area_desc: (a, b) => b.builtUpArea - a.builtUpArea,
  }
  return [...r].sort(sorters[f.sort ?? 'latest'])
}
function facets(list: Property[]) {
  const count = (fn: (p: Property) => string) => list.reduce<Record<string, number>>((m, p) => { const k = fn(p); m[k] = (m[k] ?? 0) + 1; return m }, {})
  return { city: count((p) => p.city), type: count((p) => p.type), bedrooms: count((p) => String(Math.min(p.bedrooms, 5))), construction: count((p) => p.construction) }
}
function agentOf(u: User): Agent {
  const a = col<Agent>('agents').find((x) => x.userId === u.id)
  if (!a) throw new HttpError(403, 'No agent profile is linked to this account.')
  return a
}
function createEnquiry(b: Body, user: User | null): Enquiry {
  required(b, ['name', 'phone', 'message'])
  const p = b.propertyId ? col<Property>('properties').find((x) => x.id === num(b.propertyId)) : undefined
  const id = nextId('enquiries')
  const enquiry: Enquiry = {
    id, code: `ENQ-${2000 + id}`, propertyId: p?.id, propertyTitle: p?.title, userId: user?.id, name: str(b.name), phone: str(b.phone), email: str(b.email) || user?.email || '',
    message: str(b.message), budget: b.budget ? num(b.budget) : p ? effectivePrice(p) : undefined, source: str(b.source) || 'Website', assignedAgentId: p?.agentId, status: p ? 'assigned' : 'open', createdAt: now(),
  }
  col<Enquiry>('enquiries').unshift(enquiry)
  if (p) {
    const lid = nextId('leads')
    col<Lead>('leads').unshift({
      id: lid, code: `LD-${3000 + lid}`, enquiryId: id, name: enquiry.name, phone: enquiry.phone, email: enquiry.email, propertyId: p.id, propertyTitle: p.title, budget: enquiry.budget ?? 0, source: enquiry.source,
      agentId: p.agentId, status: 'new', priority: 'medium', nextFollowUp: new Date(Date.now() + 86400000).toISOString().slice(0, 10), notes: '', activities: [{ id: 1, type: 'note', text: 'Lead created from enquiry.', by: 'System', createdAt: now() }], createdAt: now(),
    })
    const ag = col<Agent>('agents').find((a) => a.id === p.agentId)
    notify(ag?.userId, 'New lead assigned', `${enquiry.name} enquired about ${p.title}.`)
  }
  notify(user?.id, 'Enquiry received', 'Thanks for your enquiry. An agent will contact you shortly.')
  notify(1, 'New enquiry', `${enquiry.name} submitted an enquiry.`)
  saveDB()
  return enquiry
}

/* ---------- routes ---------- */
const routes: { method: string; re: RegExp; fn: Handler }[] = []
const route = (method: string, pattern: string, fn: Handler) => {
  routes.push({ method, re: new RegExp('^' + pattern.replace(/:[a-z]+/gi, '([^/]+)') + '$'), fn })
}

/* auth */
route('POST', '/auth/register', (c) => {
  required(c.body, ['name', 'email', 'password'])
  const email = str(c.body.email).toLowerCase()
  if (col<User>('users').some((u) => u.email.toLowerCase() === email)) throw new HttpError(422, 'The given data was invalid.', { email: ['This email is already registered.'] })
  if (str(c.body.password).length < 8) throw new HttpError(422, 'The given data was invalid.', { password: ['Password must be at least 8 characters.'] })
  const user: User = { id: nextId('users'), name: str(c.body.name), email, phone: str(c.body.phone), role: 'customer', status: 'active', whatsappConsent: !!c.body.whatsappConsent, emailConsent: true, createdAt: now() }
  col<User>('users').push(user)
  getDB().passwords[email] = str(c.body.password)
  notify(user.id, 'Welcome to TN HOMES', 'Your account has been created. Start exploring verified properties.')
  saveDB()
  return { token: `tnh.${user.id}`, user: strip(user) }
})
route('POST', '/auth/login', (c) => {
  required(c.body, ['email', 'password'])
  const email = str(c.body.email).toLowerCase()
  const user = col<User>('users').find((u) => u.email.toLowerCase() === email)
  if (!user || getDB().passwords[email] !== str(c.body.password)) throw new HttpError(422, 'The given data was invalid.', { email: ['These credentials do not match our records.'] })
  if (user.status === 'blocked') throw new HttpError(403, 'Your account has been blocked. Please contact support.')
  return { token: `tnh.${user.id}`, user: strip(user) }
})
route('POST', '/auth/logout', () => ({ message: 'Logged out.' }))
route('GET', '/auth/me', (c) => strip(need(c)))
route('PUT', '/auth/profile', (c) => {
  const u = need(c)
  Object.assign(u, { name: str(c.body.name) || u.name, phone: str(c.body.phone), city: str(c.body.city), address: str(c.body.address), whatsappConsent: !!c.body.whatsappConsent, emailConsent: !!c.body.emailConsent })
  saveDB(); return strip(u)
})
route('PUT', '/auth/password', (c) => {
  const u = need(c); required(c.body, ['currentPassword', 'newPassword'])
  if (getDB().passwords[u.email] !== str(c.body.currentPassword)) throw new HttpError(422, 'The given data was invalid.', { currentPassword: ['Current password is incorrect.'] })
  if (str(c.body.newPassword).length < 8) throw new HttpError(422, 'The given data was invalid.', { newPassword: ['Password must be at least 8 characters.'] })
  getDB().passwords[u.email] = str(c.body.newPassword); saveDB(); return { message: 'Password updated.' }
})
route('POST', '/auth/forgot-password', (c) => {
  required(c.body, ['email'])
  const email = str(c.body.email).toLowerCase()
  const exists = col<User>('users').some((u) => u.email.toLowerCase() === email)
  let resetToken: string | undefined
  if (exists) { resetToken = Math.random().toString(36).slice(2, 12); getDB().resetTokens[resetToken] = email; saveDB() }
  return { message: 'If the email exists, a reset link has been sent.', resetToken }
})
route('POST', '/auth/reset-password', (c) => {
  required(c.body, ['token', 'password'])
  const email = getDB().resetTokens[str(c.body.token)]
  if (!email) throw new HttpError(422, 'The given data was invalid.', { token: ['This reset link is invalid or has expired.'] })
  if (str(c.body.password).length < 8) throw new HttpError(422, 'The given data was invalid.', { password: ['Password must be at least 8 characters.'] })
  getDB().passwords[email] = str(c.body.password); delete getDB().resetTokens[str(c.body.token)]; saveDB()
  return { message: 'Password has been reset.' }
})

/* public: properties */
const publicProps = () => col<Property>('properties').filter(isPublic)
route('GET', '/properties', (c) => {
  const f = parseFilters(c.query)
  const base = publicProps().filter((p) => (f.purpose ? (f.purpose === 'rent' ? p.purpose !== 'sale' : p.purpose === 'sale') : true) && (f.group ? p.group === f.group : true))
  const res = paginate(applyFilters(publicProps(), f), c.query, 12)
  res.meta.facets = facets(base)
  return res
})
route('GET', '/properties/featured', () => publicProps().filter((p) => p.featured).slice(0, 8))
route('GET', '/properties/latest', () => [...publicProps()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8))
route('GET', '/properties/search', (c) => paginate(applyFilters(publicProps(), parseFilters(c.query)), c.query, 12))
route('GET', '/properties/map', (c) => applyFilters(publicProps(), parseFilters(c.query)).map((p) => ({ id: p.id, slug: p.slug, title: p.title, lat: p.lat, lng: p.lng, price: effectivePrice(p), purpose: p.purpose })))
route('POST', '/properties/compare', (c) => {
  const ids = (c.body.ids as number[]) ?? []
  return col<Property>('properties').filter((p) => ids.includes(p.id))
})
route('GET', '/properties/:slug', (c) => {
  const p = col<Property>('properties').find((x) => x.slug === c.params[0])
  const owner = c.user && (c.user.role === 'admin' || (c.user.role === 'agent' && agentOf(c.user).id === p?.agentId))
  if (!p || (!isPublic(p) && !(['sold', 'rented'].includes(p.listing) && p.verification === 'verified') && !owner)) throw new HttpError(404, 'Property not found.')
  if (!owner) { p.views += 1; saveDB() }
  const similar = publicProps().filter((x) => x.id !== p.id && x.group === p.group && (x.city === p.city || x.type === p.type)).slice(0, 4)
  const agent = col<Agent>('agents').find((a) => a.id === p.agentId)
  return { property: p, similar, agent }
})
route('GET', '/categories', () => col('categories'))
route('GET', '/locations', () => col('locations'))
route('GET', '/projects', (c) => {
  let list = col<Project>('projects').filter((p) => p.active)
  if (c.query.city) list = list.filter((p) => p.city === c.query.city)
  if (c.query.status) list = list.filter((p) => p.status === c.query.status)
  return list
})
route('GET', '/projects/:slug', (c) => {
  const p = col<Project>('projects').find((x) => x.slug === c.params[0] && x.active)
  if (!p) throw new HttpError(404, 'Project not found.')
  return p
})
route('GET', '/agents', (c) => searchList(col<Agent>('agents').filter((a) => a.status === 'active'), c.query.q, ['name', 'city', 'specialization']).filter((a) => !c.query.city || a.city === c.query.city))
route('GET', '/agents/:id', (c) => {
  const a = col<Agent>('agents').find((x) => x.id === num(c.params[0]))
  if (!a) throw new HttpError(404, 'Agent not found.')
  return { agent: a, properties: publicProps().filter((p) => p.agentId === a.id) }
})
route('GET', '/blogs', (c) => searchList(col<Blog>('blogs').filter((b) => b.published), c.query.q, ['title', 'excerpt']).filter((b) => !c.query.category || b.category === c.query.category).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
route('GET', '/blogs/:slug', (c) => {
  const b = col<Blog>('blogs').find((x) => x.slug === c.params[0] && x.published)
  if (!b) throw new HttpError(404, 'Article not found.')
  return { blog: b, related: col<Blog>('blogs').filter((x) => x.published && x.id !== b.id).slice(0, 3) }
})
route('GET', '/faqs', () => col('faqs'))
route('GET', '/testimonials', () => col<{ status: string }>('reviews').filter((r) => r.status === 'published'))
route('GET', '/banners', () => col<{ active: boolean }>('banners').filter((b) => b.active))
route('GET', '/settings/public', () => getDB().settings)
route('GET', '/stats', () => {
  const props = publicProps()
  const byCity = props.reduce<Record<string, number>>((m, p) => { m[p.city] = (m[p.city] ?? 0) + 1; return m }, {})
  return { properties: props.length, agents: col('agents').length, cities: Object.keys(byCity).length, customers: col<User>('users').filter((u) => u.role === 'customer').length, byCity }
})
route('POST', '/contact', (c) => { required(c.body, ['name', 'email', 'message']); col('contact').push({ id: nextId('contact'), ...c.body, createdAt: now() }); notify(1, 'New contact message', `${str(c.body.name)} sent a message.`); saveDB(); return { message: 'Thanks! We will get back to you shortly.' } })
route('POST', '/newsletter', (c) => { required(c.body, ['email']); col('newsletter').push({ id: nextId('newsletter'), email: c.body.email, createdAt: now() }); saveDB(); return { message: 'Subscribed successfully.' } })
route('POST', '/enquiries', (c) => createEnquiry(c.body, c.user))

/* customer */
route('GET', '/customer/dashboard', (c) => {
  const u = need(c, 'customer')
  const apps = col<Appointment>('appointments').filter((a) => a.userId === u.id)
  return {
    totalEnquiries: col<Enquiry>('enquiries').filter((e) => e.userId === u.id).length, savedProperties: col<{ userId: number }>('favorites').filter((f) => f.userId === u.id).length,
    upcomingAppointments: apps.filter((a) => a.date >= now().slice(0, 10) && a.status !== 'cancelled').length, alerts: col<SavedSearch>('saved-searches').filter((s) => s.userId === u.id).length,
    recent: [
      ...col<Enquiry>('enquiries').filter((e) => e.userId === u.id).slice(0, 3).map((e) => ({ id: `e${e.id}`, text: `Enquiry sent for ${e.propertyTitle ?? 'a property'}`, at: e.createdAt })),
      ...apps.slice(0, 3).map((a) => ({ id: `a${a.id}`, text: `Site visit ${a.status} - ${a.propertyTitle}`, at: a.createdAt })),
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6),
  }
})
route('GET', '/customer/favorites', (c) => {
  const u = need(c, 'customer')
  const ids = col<{ userId: number; propertyId: number }>('favorites').filter((f) => f.userId === u.id).map((f) => f.propertyId)
  return col<Property>('properties').filter((p) => ids.includes(p.id))
})
route('POST', '/customer/favorites', (c) => {
  const u = need(c, 'customer'); const pid = num(c.body.propertyId)
  if (!col<Property>('properties').some((p) => p.id === pid)) throw new HttpError(404, 'Property not found.')
  const list = col<{ id: number; userId: number; propertyId: number }>('favorites')
  if (!list.some((f) => f.userId === u.id && f.propertyId === pid)) list.push({ id: nextId('favorites'), userId: u.id, propertyId: pid })
  saveDB(); return { propertyId: pid }
})
route('DELETE', '/customer/favorites/:id', (c) => {
  const u = need(c, 'customer'); const list = col<{ id: number; userId: number; propertyId: number }>('favorites')
  const i = list.findIndex((f) => f.userId === u.id && f.propertyId === num(c.params[0]))
  if (i >= 0) list.splice(i, 1)
  saveDB(); return { message: 'Removed.' }
})
route('GET', '/customer/enquiries', (c) => col<Enquiry>('enquiries').filter((e) => e.userId === need(c, 'customer').id))
route('POST', '/customer/enquiries', (c) => createEnquiry(c.body, need(c, 'customer')))
route('GET', '/customer/appointments', (c) => col<Appointment>('appointments').filter((a) => a.userId === need(c, 'customer').id).sort((a, b) => b.date.localeCompare(a.date)))
route('POST', '/customer/appointments', (c) => {
  const u = need(c, 'customer'); required(c.body, ['propertyId', 'date', 'time'])
  const p = col<Property>('properties').find((x) => x.id === num(c.body.propertyId))
  if (!p) throw new HttpError(404, 'Property not found.')
  if (str(c.body.date) < now().slice(0, 10)) throw new HttpError(422, 'The given data was invalid.', { date: ['Please choose a future date.'] })
  const id = nextId('appointments')
  const a: Appointment = { id, code: `VIS-${4000 + id}`, propertyId: p.id, propertyTitle: p.title, userId: u.id, customerName: u.name, phone: str(c.body.phone) || u.phone, agentId: p.agentId, date: str(c.body.date), time: str(c.body.time), status: 'pending', notes: str(c.body.notes), createdAt: now() }
  col<Appointment>('appointments').unshift(a)
  notify(u.id, 'Site visit requested', `Your visit to ${p.title} on ${a.date} at ${a.time} is pending confirmation.`)
  notify(col<Agent>('agents').find((x) => x.id === p.agentId)?.userId, 'New site visit', `${u.name} requested a visit on ${a.date} at ${a.time}.`)
  saveDB(); return a
})
route('PATCH', '/customer/appointments/:id', (c) => {
  const u = need(c, 'customer'); const a = col<Appointment>('appointments').find((x) => x.id === num(c.params[0]) && x.userId === u.id)
  if (!a) throw new HttpError(404, 'Appointment not found.')
  if (c.body.status === 'cancelled') a.status = 'cancelled'
  saveDB(); return a
})
route('GET', '/customer/sell-rent-requests', (c) => col<SellRentRequest>('sell-rent-requests').filter((r) => r.userId === need(c, 'customer').id))
route('POST', '/customer/sell-rent-requests', (c) => createSellRequest(c))
route('POST', '/sell-rent-requests', (c) => createSellRequest(c))
function createSellRequest(c: Ctx) {
  required(c.body, ['name', 'phone', 'purpose', 'type', 'city'])
  const id = nextId('sell-rent-requests')
  const r: SellRentRequest = { id, code: `SR-${5000 + id}`, userId: c.user?.id, name: str(c.body.name), phone: str(c.body.phone), email: str(c.body.email), purpose: c.body.purpose as SellRentRequest['purpose'], type: str(c.body.type), city: str(c.body.city), locality: str(c.body.locality), expectedPrice: num(c.body.expectedPrice), description: str(c.body.description), status: 'new', createdAt: now() }
  col<SellRentRequest>('sell-rent-requests').unshift(r); notify(1, 'New sell request', `${r.name} wants to ${r.purpose} a ${r.type}.`); saveDB(); return r
}
route('GET', '/customer/alerts', (c) => col<SavedSearch>('saved-searches').filter((s) => s.userId === need(c, 'customer').id))
route('POST', '/customer/alerts', (c) => {
  const u = need(c, 'customer'); required(c.body, ['label', 'query'])
  const s: SavedSearch = { id: nextId('saved-searches'), userId: u.id, label: str(c.body.label), query: str(c.body.query), frequency: (c.body.frequency as SavedSearch['frequency']) || 'daily', createdAt: now() }
  col<SavedSearch>('saved-searches').push(s); saveDB(); return s
})
route('DELETE', '/customer/alerts/:id', (c) => { const u = need(c, 'customer'); const l = col<SavedSearch>('saved-searches'); const i = l.findIndex((s) => s.id === num(c.params[0]) && s.userId === u.id); if (i >= 0) l.splice(i, 1); saveDB(); return { message: 'Deleted.' } })

/* notifications (all roles) */
route('GET', '/notifications', (c) => col<NotificationItem>('notifications').filter((n) => n.userId === need(c).id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
route('POST', '/notifications/read-all', (c) => { const u = need(c); col<NotificationItem>('notifications').forEach((n) => { if (n.userId === u.id) n.read = true }); saveDB(); return { message: 'ok' } })
route('PATCH', '/notifications/:id/read', (c) => { const u = need(c); const n = col<NotificationItem>('notifications').find((x) => x.id === num(c.params[0]) && x.userId === u.id); if (n) n.read = true; saveDB(); return n })

/* agent */
route('GET', '/agent/dashboard', (c) => {
  const a = agentOf(need(c, 'agent'))
  const leads = col<Lead>('leads').filter((l) => l.agentId === a.id)
  const apps = col<Appointment>('appointments').filter((x) => x.agentId === a.id)
  const today = now().slice(0, 10)
  return {
    properties: col<Property>('properties').filter((p) => p.agentId === a.id).length, leads: leads.length, newEnquiries: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length, upcomingVisits: apps.filter((x) => x.date >= today && x.status !== 'cancelled' && x.status !== 'completed').length, converted: leads.filter((l) => l.status === 'converted').length,
    funnel: ['new', 'contacted', 'interested', 'site_visit', 'negotiation', 'converted', 'lost'].map((s) => ({ status: s, count: leads.filter((l) => l.status === s).length })),
    followUps: leads.filter((l) => l.nextFollowUp && l.nextFollowUp <= today && !['converted', 'lost'].includes(l.status)).slice(0, 6),
  }
})
route('GET', '/agent/properties', (c) => {
  const a = agentOf(need(c, 'agent'))
  return paginate(searchList(col<Property>('properties').filter((p) => p.agentId === a.id), c.query.q, ['title', 'code', 'city', 'locality']), c.query, 10)
})
route('POST', '/agent/properties', (c) => {
  const a = agentOf(need(c, 'agent'))
  return saveProperty(c.body, a.id, c.user!.name)
})
route('PUT', '/agent/properties/:id', (c) => {
  const a = agentOf(need(c, 'agent')); const p = col<Property>('properties').find((x) => x.id === num(c.params[0]))
  if (!p) throw new HttpError(404, 'Property not found.')
  if (p.agentId !== a.id) throw new HttpError(403, 'You can only edit your own properties.')
  return saveProperty(c.body, a.id, c.user!.name, p)
})
route('GET', '/agent/leads', (c) => {
  const a = agentOf(need(c, 'agent'))
  let l = col<Lead>('leads').filter((x) => x.agentId === a.id)
  if (c.query.status) l = l.filter((x) => x.status === c.query.status)
  return searchList(l, c.query.q, ['name', 'phone', 'code', 'propertyTitle']).sort((x, y) => y.createdAt.localeCompare(x.createdAt))
})
route('GET', '/agent/leads/:id', (c) => ownLead(c))
function ownLead(c: Ctx): Lead {
  const u = need(c, 'agent'); const a = agentOf(u)
  const l = col<Lead>('leads').find((x) => x.id === num(c.params[0]))
  if (!l) throw new HttpError(404, 'Lead not found.')
  if (l.agentId !== a.id) throw new HttpError(403, 'This lead is assigned to another agent.')
  return l
}
route('PATCH', '/agent/leads/:id/status', (c) => {
  const l = ownLead(c); required(c.body, ['status'])
  const from = l.status; l.status = c.body.status as Lead['status']
  if (c.body.priority) l.priority = c.body.priority as Lead['priority']
  if (c.body.nextFollowUp !== undefined) l.nextFollowUp = str(c.body.nextFollowUp) || undefined
  l.activities.unshift({ id: Date.now(), type: 'status', text: `Status changed from ${from} to ${l.status}.`, by: c.user!.name, createdAt: now() })
  saveDB(); return l
})
route('POST', '/agent/leads/:id/activities', (c) => {
  const l = ownLead(c); required(c.body, ['text'])
  l.activities.unshift({ id: Date.now(), type: (c.body.type as Lead['activities'][number]['type']) || 'note', text: str(c.body.text), by: c.user!.name, createdAt: now() })
  if (c.body.nextFollowUp) l.nextFollowUp = str(c.body.nextFollowUp)
  saveDB(); return l
})
route('GET', '/agent/appointments', (c) => { const a = agentOf(need(c, 'agent')); return col<Appointment>('appointments').filter((x) => x.agentId === a.id).sort((x, y) => x.date.localeCompare(y.date)) })
route('PATCH', '/agent/appointments/:id', (c) => {
  const a = agentOf(need(c, 'agent')); const ap = col<Appointment>('appointments').find((x) => x.id === num(c.params[0]))
  if (!ap) throw new HttpError(404, 'Appointment not found.')
  if (ap.agentId !== a.id) throw new HttpError(403, 'This appointment belongs to another agent.')
  if (c.body.status) ap.status = c.body.status as Appointment['status']
  if (c.body.date) ap.date = str(c.body.date)
  if (c.body.time) ap.time = str(c.body.time)
  notify(ap.userId, 'Site visit update', `Your visit to ${ap.propertyTitle} is now ${ap.status}.`)
  saveDB(); return ap
})
route('POST', '/agent/appointments', (c) => {
  const a = agentOf(need(c, 'agent')); required(c.body, ['propertyId', 'customerName', 'date', 'time'])
  const p = col<Property>('properties').find((x) => x.id === num(c.body.propertyId) && x.agentId === a.id)
  if (!p) throw new HttpError(403, 'You can only schedule visits for your own properties.')
  const id = nextId('appointments')
  const ap: Appointment = { id, code: `VIS-${4000 + id}`, propertyId: p.id, propertyTitle: p.title, userId: 0, customerName: str(c.body.customerName), phone: str(c.body.phone), agentId: a.id, date: str(c.body.date), time: str(c.body.time), status: 'confirmed', createdAt: now() }
  col<Appointment>('appointments').unshift(ap); saveDB(); return ap
})
route('GET', '/agent/reports', (c) => {
  const a = agentOf(need(c, 'agent')); const leads = col<Lead>('leads').filter((l) => l.agentId === a.id); const props = col<Property>('properties').filter((p) => p.agentId === a.id)
  const conv = leads.length ? Math.round((leads.filter((l) => l.status === 'converted').length / leads.length) * 100) : 0
  return {
    conversionRate: conv, totalViews: props.reduce((s, p) => s + p.views, 0), totalLeads: leads.length,
    funnel: ['new', 'contacted', 'interested', 'site_visit', 'negotiation', 'converted', 'lost'].map((s) => ({ status: s, count: leads.filter((l) => l.status === s).length })),
    topProperties: [...props].sort((x, y) => y.views - x.views).slice(0, 5).map((p) => ({ title: p.title, views: p.views, city: p.city })),
    monthly: lastMonths(6).map((m) => ({ month: m.label, leads: leads.filter((l) => l.createdAt.startsWith(m.key)).length, converted: leads.filter((l) => l.createdAt.startsWith(m.key) && l.status === 'converted').length })),
  }
})
function lastMonths(n: number) {
  const out: { key: string; label: string }[] = []; const d = new Date()
  for (let i = n - 1; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push({ key: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`, label: x.toLocaleString('en', { month: 'short' }) }) }
  return out
}

/* property create/update shared by agent + admin */
function saveProperty(b: Body, agentId: number, actor: string, existing?: Property): Property {
  required(b, ['title', 'purpose', 'group', 'type', 'city', 'locality'])
  const settings = getDB().settings
  const price = num(b.price)
  if (!price && !num(b.rent)) throw new HttpError(422, 'The given data was invalid.', { price: ['Price or rent amount is required.'] })
  const id = existing?.id ?? nextId('properties')
  const title = str(b.title)
  const base: Property = existing ?? {
    id, code: `TNH-${String(1000 + id).padStart(6, '0')}`, slug: '', title, description: '', purpose: 'sale', group: 'residential', type: '', price: 0, district: '', city: '', locality: '', address: '', pincode: '', lat: 0, lng: 0, bedrooms: 0, bathrooms: 0, builtUpArea: 0, areaUnit: 'sqft', facing: '', furnishing: 'Unfurnished', parking: 0, ageYears: 0, construction: 'ready', amenities: [], images: [], floorPlans: [], featured: false, verification: 'pending', listing: 'draft', agentId, views: 0, createdAt: now(),
  }
  const merged: Property = {
    ...base, title, description: str(b.description), purpose: b.purpose as Property['purpose'], group: b.group as Property['group'], type: str(b.type), price, rent: b.rent ? num(b.rent) : undefined, deposit: b.deposit ? num(b.deposit) : undefined,
    district: str(b.district), city: str(b.city), locality: str(b.locality), address: str(b.address), pincode: str(b.pincode), lat: num(b.lat, base.lat), lng: num(b.lng, base.lng), bedrooms: num(b.bedrooms), bathrooms: num(b.bathrooms),
    builtUpArea: num(b.builtUpArea), plotArea: b.plotArea ? num(b.plotArea) : undefined, areaUnit: (b.areaUnit as Property['areaUnit']) || 'sqft', facing: str(b.facing), furnishing: str(b.furnishing) || 'Unfurnished',
    floor: b.floor !== undefined && b.floor !== '' ? num(b.floor) : undefined, totalFloors: b.totalFloors !== undefined && b.totalFloors !== '' ? num(b.totalFloors) : undefined, parking: num(b.parking), ageYears: num(b.ageYears),
    construction: (b.construction as Property['construction']) || 'ready', amenities: (b.amenities as string[]) ?? [], images: (b.images as string[]) ?? base.images, videoUrl: str(b.videoUrl) || undefined, tourUrl: str(b.tourUrl) || undefined,
    floorPlans: (b.floorPlans as string[]) ?? base.floorPlans, rera: str(b.rera) || undefined, featured: !!b.featured, seoTitle: str(b.seoTitle) || undefined, seoDescription: str(b.seoDescription) || undefined, agentId: num(b.agentId, agentId),
  }
  merged.slug = existing?.slug ?? kebab(`${title} ${merged.locality} ${merged.city} ${id}`)
  if (!merged.images.length) merged.images = ['/images/ph-house.svg']
  if (b.listing) merged.listing = b.listing as Property['listing']
  else if (!existing) merged.listing = 'active'
  if (b.verification) merged.verification = b.verification as Property['verification']
  else if (!existing && settings.autoApproveAgentListings) merged.verification = 'verified'
  if (existing) Object.assign(existing, merged); else col<Property>('properties').unshift(merged)
  audit(actor, existing ? 'property.updated' : 'property.created', 'Property', id)
  if (!existing) notify(1, 'Property awaiting review', `${title} was submitted for verification.`)
  saveDB(); return existing ?? merged
}

/* ---------- admin ---------- */
route('GET', '/admin/dashboard', (c) => {
  need(c, 'admin')
  const props = col<Property>('properties'); const leads = col<Lead>('leads'); const apps = col<Appointment>('appointments'); const enq = col<Enquiry>('enquiries')
  return {
    totalProperties: props.length, activeProperties: props.filter((p) => p.listing === 'active').length, pendingApproval: props.filter((p) => p.verification === 'pending').length,
    agents: col('agents').length, customers: col<User>('users').filter((u) => u.role === 'customer').length, enquiries: enq.length, openEnquiries: enq.filter((e) => e.status === 'open').length,
    appointments: apps.length, converted: leads.filter((l) => l.status === 'converted').length, revenue: col<{ status: string; amount: number }>('payments').filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    monthly: lastMonths(6).map((m, i) => ({ month: m.label, enquiries: enq.filter((e) => e.createdAt.startsWith(m.key)).length + i, properties: props.filter((p) => p.createdAt.startsWith(m.key)).length, visits: apps.filter((a) => a.createdAt.startsWith(m.key)).length })),
    recentEnquiries: enq.slice(0, 6), pending: props.filter((p) => p.verification === 'pending').slice(0, 5),
  }
})
route('GET', '/admin/reports', (c) => {
  need(c, 'admin')
  const props = col<Property>('properties'); const leads = col<Lead>('leads'); const enq = col<Enquiry>('enquiries'); const apps = col<Appointment>('appointments')
  const tally = (list: string[]) => Object.entries(list.reduce<Record<string, number>>((m, k) => { m[k] = (m[k] ?? 0) + 1; return m }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  return {
    monthly: lastMonths(6).map((m, i) => ({ month: m.label, views: props.reduce((s, p) => s + p.views, 0) / 6 + i * 180, enquiries: enq.filter((e) => e.createdAt.startsWith(m.key)).length + i, appointments: apps.filter((a) => a.createdAt.startsWith(m.key)).length, conversions: leads.filter((l) => l.status === 'converted' && l.createdAt.startsWith(m.key)).length })),
    byCity: tally(props.map((p) => p.city)).slice(0, 8), byType: tally(props.map((p) => p.type)), byStatus: tally(props.map((p) => p.listing)), leadFunnel: tally(leads.map((l) => l.status)),
    topProperties: [...props].sort((a, b) => b.views - a.views).slice(0, 8).map((p) => ({ id: p.id, code: p.code, title: p.title, city: p.city, views: p.views })),
    agentPerformance: col<Agent>('agents').map((a) => ({ name: a.name, leads: leads.filter((l) => l.agentId === a.id).length, converted: leads.filter((l) => l.agentId === a.id && l.status === 'converted').length })),
  }
})
route('GET', '/admin/properties', (c) => {
  need(c, 'admin')
  let l = col<Property>('properties')
  if (c.query.verification) l = l.filter((p) => p.verification === c.query.verification)
  if (c.query.listing) l = l.filter((p) => p.listing === c.query.listing)
  if (c.query.agentId) l = l.filter((p) => p.agentId === num(c.query.agentId))
  return paginate(searchList(l, c.query.q, ['title', 'code', 'city', 'locality']).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), c.query, 10)
})
route('GET', '/admin/properties/:id', (c) => { need(c, 'admin'); const p = col<Property>('properties').find((x) => x.id === num(c.params[0])); if (!p) throw new HttpError(404, 'Property not found.'); return p })
route('POST', '/admin/properties', (c) => { need(c, 'admin'); return saveProperty({ verification: 'verified', ...c.body }, num(c.body.agentId, 1), c.user!.name) })
route('PUT', '/admin/properties/:id', (c) => { need(c, 'admin'); const p = col<Property>('properties').find((x) => x.id === num(c.params[0])); if (!p) throw new HttpError(404, 'Property not found.'); return saveProperty(c.body, p.agentId, c.user!.name, p) })
route('DELETE', '/admin/properties/:id', (c) => { need(c, 'admin'); const l = col<Property>('properties'); const i = l.findIndex((x) => x.id === num(c.params[0])); if (i < 0) throw new HttpError(404, 'Property not found.'); l.splice(i, 1); audit(c.user!.name, 'property.deleted', 'Property', num(c.params[0])); saveDB(); return { message: 'Deleted.' } })
route('POST', '/admin/properties/:id/approve', (c) => {
  need(c, 'admin'); const p = col<Property>('properties').find((x) => x.id === num(c.params[0])); if (!p) throw new HttpError(404, 'Property not found.')
  p.verification = 'verified'; if (p.listing === 'draft') p.listing = 'active'
  notify(col<Agent>('agents').find((a) => a.id === p.agentId)?.userId, 'Property approved', `${p.title} is verified and live.`); audit(c.user!.name, 'property.approved', 'Property', p.id); saveDB(); return p
})
route('POST', '/admin/properties/:id/reject', (c) => {
  need(c, 'admin'); const p = col<Property>('properties').find((x) => x.id === num(c.params[0])); if (!p) throw new HttpError(404, 'Property not found.')
  p.verification = 'rejected'; p.listing = 'inactive'
  notify(col<Agent>('agents').find((a) => a.id === p.agentId)?.userId, 'Property rejected', `${p.title} was rejected. ${str(c.body.reason)}`); audit(c.user!.name, 'property.rejected', 'Property', p.id); saveDB(); return p
})
route('POST', '/admin/enquiries/:id/assign', (c) => {
  need(c, 'admin'); required(c.body, ['agentId'])
  const e = col<Enquiry>('enquiries').find((x) => x.id === num(c.params[0])); const a = col<Agent>('agents').find((x) => x.id === num(c.body.agentId))
  if (!e || !a) throw new HttpError(404, 'Enquiry or agent not found.')
  e.assignedAgentId = a.id; e.status = 'assigned'
  const lead = col<Lead>('leads').find((l) => l.enquiryId === e.id)
  if (lead) lead.agentId = a.id
  else { const lid = nextId('leads'); col<Lead>('leads').unshift({ id: lid, code: `LD-${3000 + lid}`, enquiryId: e.id, name: e.name, phone: e.phone, email: e.email, propertyId: e.propertyId, propertyTitle: e.propertyTitle, budget: e.budget ?? 0, source: e.source, agentId: a.id, status: 'new', priority: 'medium', notes: '', activities: [{ id: 1, type: 'note', text: `Assigned to ${a.name}.`, by: c.user!.name, createdAt: now() }], createdAt: now() }) }
  notify(a.userId, 'New lead assigned', `${e.name} - ${e.propertyTitle ?? 'General enquiry'}`); audit(c.user!.name, 'lead.assigned', 'Enquiry', e.id); saveDB(); return e
})
route('POST', '/admin/leads/:id/assign', (c) => {
  need(c, 'admin'); const l = col<Lead>('leads').find((x) => x.id === num(c.params[0])); const a = col<Agent>('agents').find((x) => x.id === num(c.body.agentId))
  if (!l || !a) throw new HttpError(404, 'Lead or agent not found.')
  l.agentId = a.id; l.activities.unshift({ id: Date.now(), type: 'note', text: `Reassigned to ${a.name}.`, by: c.user!.name, createdAt: now() }); notify(a.userId, 'Lead assigned', `${l.name} was assigned to you.`); saveDB(); return l
})
route('POST', '/admin/agents', (c) => {
  need(c, 'admin'); required(c.body, ['name', 'email', 'phone'])
  const email = str(c.body.email).toLowerCase()
  if (col<User>('users').some((u) => u.email.toLowerCase() === email)) throw new HttpError(422, 'The given data was invalid.', { email: ['This email is already registered.'] })
  const user: User = { id: nextId('users'), name: str(c.body.name), email, phone: str(c.body.phone), role: 'agent', status: 'active', city: str(c.body.city), createdAt: now() }
  col<User>('users').push(user); getDB().passwords[email] = str(c.body.password) || 'Agent@123'
  const agent: Agent = { id: nextId('agents'), userId: user.id, name: user.name, email, phone: user.phone, whatsapp: user.phone.replace(/\D/g, ''), bio: str(c.body.bio), specialization: str(c.body.specialization), city: str(c.body.city), experienceYears: num(c.body.experienceYears), languages: csv(str(c.body.languages)).length ? csv(str(c.body.languages)) : ['Tamil', 'English'], reraId: str(c.body.reraId), rating: 4.5, status: 'active' }
  col<Agent>('agents').push(agent); audit(c.user!.name, 'agent.created', 'Agent', agent.id); saveDB(); return agent
})
route('PUT', '/admin/settings', (c) => { need(c, 'admin'); Object.assign(getDB().settings, c.body); audit(c.user!.name, 'settings.updated', 'Settings'); saveDB(); return getDB().settings })
route('GET', '/admin/settings', (c) => { need(c, 'admin'); return getDB().settings })
route('POST', '/admin/reset-demo', (c) => { need(c, 'admin'); resetDB(); return { message: 'Demo data reset.' } })
route('POST', '/admin/media', (c) => {
  need(c, 'admin'); required(c.body, ['name', 'url'])
  const m = { id: nextId('media'), name: str(c.body.name), url: str(c.body.url), size: num(c.body.size), type: str(c.body.type), createdAt: now() }
  col('media').unshift(m); saveDB(); return m
})

/* generic admin CRUD */
const RESOURCES: Record<string, { search: string[]; sort?: string }> = {
  users: { search: ['name', 'email', 'phone', 'city'] }, agents: { search: ['name', 'email', 'city', 'specialization'] }, categories: { search: ['name', 'description'] }, locations: { search: ['name', 'pincode', 'type'] },
  projects: { search: ['name', 'builder', 'city'] }, blogs: { search: ['title', 'category'] }, banners: { search: ['title'] }, reviews: { search: ['name', 'text', 'city'] }, payments: { search: ['code', 'userName', 'purpose'] },
  enquiries: { search: ['code', 'name', 'phone', 'propertyTitle'] }, leads: { search: ['code', 'name', 'phone', 'propertyTitle'] }, appointments: { search: ['code', 'customerName', 'propertyTitle'] },
  'sell-rent-requests': { search: ['code', 'name', 'city', 'type'] }, 'audit-logs': { search: ['actor', 'action', 'entity'] }, roles: { search: ['name'] }, media: { search: ['name'] }, notifications: { search: ['title', 'body'] }, faqs: { search: ['question', 'category'] },
}
const READONLY = new Set(['audit-logs'])
for (const name of Object.keys(RESOURCES)) {
  route('GET', `/admin/${name}`, (c) => {
    need(c, 'admin'); let list = [...col<Record<string, unknown>>(name)]
    for (const [k, v] of Object.entries(c.query)) if (!['q', 'page', 'perPage'].includes(k) && v) list = list.filter((r) => str(r[k]) === v)
    list = searchList(list, c.query.q, RESOURCES[name].search)
    if (name === 'notifications') list = list.filter((n) => n.userId === c.user!.id)
    list.sort((a, b) => num(b.id) - num(a.id))
    return paginate(list, c.query, 10)
  })
  if (READONLY.has(name)) continue
  route('POST', `/admin/${name}`, (c) => {
    need(c, 'admin'); const id = nextId(name); const row = { createdAt: now(), ...c.body, id } as Record<string, unknown>
    if (name === 'categories' || name === 'projects' || name === 'blogs') row.slug = kebab(str(row.name ?? row.title))
    if (name === 'users') { if (!row.role) row.role = 'customer'; if (!row.status) row.status = 'active'; getDB().passwords[str(row.email).toLowerCase()] = str(row.password) || 'Welcome@123'; delete row.password }
    col<Record<string, unknown>>(name).push(row); audit(c.user!.name, `${name}.created`, name, id); saveDB(); return row
  })
  route('PUT', `/admin/${name}/:id`, (c) => {
    need(c, 'admin'); const row = col<Record<string, unknown>>(name).find((r) => num(r.id) === num(c.params[0])); if (!row) throw new HttpError(404, 'Record not found.')
    const body = { ...c.body }; delete body.id; delete body.password
    Object.assign(row, body); if ((name === 'categories' || name === 'projects' || name === 'blogs') && (body.name || body.title)) row.slug = kebab(str(row.name ?? row.title))
    audit(c.user!.name, `${name}.updated`, name, num(row.id)); saveDB(); return row
  })
  route('DELETE', `/admin/${name}/:id`, (c) => {
    const u = need(c, 'admin'); const l = col<Record<string, unknown>>(name); const i = l.findIndex((r) => num(r.id) === num(c.params[0]))
    if (i < 0) throw new HttpError(404, 'Record not found.')
    if (name === 'users' && num(l[i].id) === u.id) throw new HttpError(422, 'You cannot delete your own account.')
    l.splice(i, 1); audit(u.name, `${name}.deleted`, name, num(c.params[0])); saveDB(); return { message: 'Deleted.' }
  })
}

/* ---------- axios adapter ---------- */
function userFromToken(header: unknown): User | null {
  const m = /^Bearer tnh\.(\d+)/.exec(str(header)); if (!m) return null
  return col<User>('users').find((u) => u.id === Number(m[1]) && u.status === 'active') ?? null
}
export const mockAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  await new Promise((r) => setTimeout(r, 180 + Math.random() * 220))
  const method = (config.method ?? 'get').toUpperCase()
  const path = (config.url ?? '').split('?')[0].replace(/\/+$/, '') || '/'
  const query: Record<string, string> = {}
  for (const [k, v] of Object.entries((config.params ?? {}) as Record<string, unknown>)) if (v !== undefined && v !== null && v !== '') query[k] = Array.isArray(v) ? v.join(',') : String(v)
  let body: Body = {}
  if (typeof config.data === 'string' && config.data) { try { body = JSON.parse(config.data) as Body } catch { body = {} } }
  const auth = (config.headers as unknown as { get?: (k: string) => unknown })?.get?.('Authorization')
  const user = userFromToken(auth)
  const respond = (status: number, data: unknown): AxiosResponse => ({ data, status, statusText: String(status), headers: {}, config, request: {} })
  try {
    for (const r of routes) {
      if (r.method !== method) continue
      const m = r.re.exec(path); if (!m) continue
      const data = r.fn({ method, path, query, body, user, params: m.slice(1).map(decodeURIComponent) })
      const paged = data !== null && typeof data === 'object' && 'meta' in (data as object) && 'data' in (data as object)
      return respond(200, paged ? data : { data })
    }
    throw new HttpError(404, `Route ${method} ${path} not found.`)
  } catch (e) {
    const err = e instanceof HttpError ? e : new HttpError(500, e instanceof Error ? e.message : 'Server error')
    const res = respond(err.status, { message: err.message, errors: err.errors })
    const axiosErr = Object.assign(new Error(err.message), { isAxiosError: true, response: res, config, name: 'AxiosError', toJSON: () => ({}) })
    return Promise.reject(axiosErr)
  }
}
