import * as S from './seed'

export type Row = { id: number } & Record<string, unknown>
export interface MockDB {
  collections: Record<string, Row[]>
  passwords: Record<string, string>
  resetTokens: Record<string, string>
  settings: S.SiteSettingsRef
  counters: Record<string, number>
}

const KEY = 'tnh_mock_db_v1'
const asRows = (x: unknown) => x as Row[]

function fresh(): MockDB {
  const collections: Record<string, Row[]> = {
    users: asRows(S.SEED_USERS), agents: asRows(S.SEED_AGENTS), properties: asRows(S.SEED_PROPERTIES), locations: asRows(S.SEED_LOCATIONS),
    categories: asRows(S.SEED_CATEGORIES), projects: asRows(S.SEED_PROJECTS), enquiries: asRows(S.SEED_ENQUIRIES), leads: asRows(S.SEED_LEADS),
    appointments: asRows(S.SEED_APPOINTMENTS), 'sell-rent-requests': asRows(S.SEED_SELL_REQUESTS), reviews: asRows(S.SEED_REVIEWS), blogs: asRows(S.SEED_BLOGS),
    banners: asRows(S.SEED_BANNERS), faqs: asRows(S.SEED_FAQS), notifications: asRows(S.SEED_NOTIFICATIONS), 'saved-searches': asRows(S.SEED_SAVED_SEARCHES),
    favorites: asRows(S.SEED_FAVORITES), payments: asRows(S.SEED_PAYMENTS), 'audit-logs': asRows(S.SEED_AUDIT), roles: asRows(S.SEED_ROLES), media: asRows(S.SEED_MEDIA),
    newsletter: [], contact: [],
  }
  const counters: Record<string, number> = {}
  for (const [k, v] of Object.entries(collections)) counters[k] = v.reduce((m, r) => Math.max(m, r.id), 0)
  return { collections, passwords: { ...S.SEED_PASSWORDS }, resetTokens: {}, settings: { ...S.SEED_SETTINGS }, counters }
}

let db: MockDB | null = null
export function getDB(): MockDB {
  if (db) return db
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) { db = JSON.parse(raw) as MockDB; return db }
  } catch { /* ignore corrupt storage */ }
  db = fresh()
  return db
}
export function saveDB() {
  if (!db) return
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    try {
      // quota exceeded (e.g. large uploaded images): persist without inline data URLs
      localStorage.setItem(KEY, JSON.stringify(db, (_k, v) => (typeof v === 'string' && v.startsWith('data:') ? '/images/ph-house.svg' : v)))
    } catch { /* give up, keep in memory */ }
  }
}
export function resetDB() { localStorage.removeItem(KEY); db = null }
export function col<T>(name: string): T[] { return (getDB().collections[name] ??= []) as unknown as T[] }
export function nextId(name: string): number { const d = getDB(); d.counters[name] = (d.counters[name] ?? 0) + 1; return d.counters[name] }
