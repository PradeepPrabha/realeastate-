import { beforeEach, describe, expect, it } from 'vitest'
import { resetDB } from '@/mock/db'
import { adminApi, agentApi, authApi, customerApi, publicApi } from '@/services/api'
import { TOKEN_KEY, parseApiError } from '@/services/http'

const login = async (email: string, password: string) => { localStorage.setItem(TOKEN_KEY, (await authApi.login({ email, password })).token) }
beforeEach(() => { localStorage.clear(); resetDB() })

describe('authentication', () => {
  it('rejects bad credentials with a 422 field error', async () => {
    const e = await authApi.login({ email: 'admin@tnhomes.in', password: 'wrong' }).catch((x) => parseApiError(x))
    expect((e as { status: number }).status).toBe(422)
  })
  it('registers a customer and returns /auth/me', async () => {
    const r = await authApi.register({ name: 'Test User', email: 'test@example.com', password: 'Passw0rd!' })
    localStorage.setItem(TOKEN_KEY, r.token)
    expect((await authApi.me()).role).toBe('customer')
  })
})
describe('authorization (record level)', () => {
  it('blocks anonymous and customer access to admin endpoints', async () => {
    expect(await adminApi.dashboard().catch((e) => parseApiError(e).status)).toBe(401)
    await login('customer@tnhomes.in', 'Customer@123')
    expect(await adminApi.dashboard().catch((e) => parseApiError(e).status)).toBe(403)
    expect(await agentApi.leads().catch((e) => parseApiError(e).status)).toBe(403)
  })
  it('agents only see their own leads and cannot edit others', async () => {
    await login('agent@tnhomes.in', 'Agent@123')
    const mine = await agentApi.leads()
    expect(mine.length).toBeGreaterThan(0)
    expect(mine.every((l) => l.agentId === 1)).toBe(true)
    await login('admin@tnhomes.in', 'Admin@123')
    const all = await adminApi.list<{ id: number; agentId: number | null }>('leads', { perPage: 100 })
    const foreign = all.data.find((l) => l.agentId !== 1)!
    await login('agent@tnhomes.in', 'Agent@123')
    expect(await agentApi.setLeadStatus(foreign.id, { status: 'lost' }).catch((e) => parseApiError(e).status)).toBe(403)
  })
  it('customers only see their own enquiries', async () => {
    await login('customer@tnhomes.in', 'Customer@123')
    const mine = await customerApi.enquiries()
    expect(mine.length).toBeGreaterThan(0)
    expect(mine.every((e) => e.userId === 8)).toBe(true)
  })
})
describe('property publishing workflow', () => {
  const body = { title: 'Workflow Test Villa', description: 'A villa created by the automated test.', purpose: 'sale', group: 'residential', type: 'Villa', price: 9000000, city: 'Coimbatore', locality: 'RS Puram', builtUpArea: 2000 }
  it('keeps agent listings hidden until an admin approves them', async () => {
    await login('agent@tnhomes.in', 'Agent@123')
    const p = await agentApi.createProperty(body)
    expect(p.verification).toBe('pending')
    expect((await publicApi.properties({ q: 'Workflow Test Villa' })).data).toHaveLength(0)
    await login('admin@tnhomes.in', 'Admin@123')
    await adminApi.approve(p.id)
    expect((await publicApi.properties({ q: 'Workflow Test Villa' })).data).toHaveLength(1)
  })
  it('rejects invalid property data with 422', async () => {
    await login('agent@tnhomes.in', 'Agent@123')
    expect(await agentApi.createProperty({ title: 'x' }).catch((e) => parseApiError(e).status)).toBe(422)
  })
})
describe('search filters', () => {
  it('filters by purpose, city, bedrooms and price and paginates', async () => {
    const r = await publicApi.properties({ purpose: 'sale', city: 'Chennai', maxPrice: 20_000_000, perPage: 5 })
    expect(r.meta.perPage).toBe(5)
    expect(r.data.every((p) => p.purpose === 'sale' && p.city === 'Chennai' && p.price <= 20_000_000)).toBe(true)
  })
  it('never exposes drafts or unverified listings publicly', async () => {
    const r = await publicApi.properties({ perPage: 100 })
    expect(r.data.every((p) => p.listing === 'active' && p.verification === 'verified')).toBe(true)
  })
})
describe('customer actions', () => {
  it('creates an enquiry that becomes a lead for the property agent', async () => {
    await login('customer@tnhomes.in', 'Customer@123')
    const prop = (await publicApi.properties({ perPage: 1 })).data[0]
    const e = await customerApi.enquire({ name: 'Arun', phone: '9843011223', message: 'Interested in this property', propertyId: prop.id })
    expect(e.assignedAgentId).toBe(prop.agentId)
    await login('admin@tnhomes.in', 'Admin@123')
    const leads = await adminApi.list<{ enquiryId?: number }>('leads', { perPage: 100 })
    expect(leads.data.some((l) => l.enquiryId === e.id)).toBe(true)
  })
  it('rejects past-dated site visits', async () => {
    await login('customer@tnhomes.in', 'Customer@123')
    const prop = (await publicApi.properties({ perPage: 1 })).data[0]
    expect(await customerApi.book({ propertyId: prop.id, date: '2020-01-01', time: '10:00 AM' }).catch((e) => parseApiError(e).status)).toBe(422)
  })
})
