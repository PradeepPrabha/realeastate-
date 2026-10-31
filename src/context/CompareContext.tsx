import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'

const KEY = 'tnh_compare'
const MAX = 4
interface CompareState { ids: number[]; toggle: (id: number) => void; has: (id: number) => boolean; remove: (id: number) => void; clear: () => void }
const Ctx = createContext<CompareState | null>(null)

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as number[] } catch { return [] } })
  const persist = (next: number[]) => { setIds(next); try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ } }
  const toggle = useCallback((id: number) => {
    if (ids.includes(id)) return persist(ids.filter((x) => x !== id))
    if (ids.length >= MAX) return void toast.error(`You can compare up to ${MAX} properties.`)
    persist([...ids, id]); toast.success('Added to compare')
  }, [ids])
  const value = useMemo<CompareState>(() => ({ ids, toggle, has: (id) => ids.includes(id), remove: (id) => persist(ids.filter((x) => x !== id)), clear: () => persist([]) }), [ids, toggle])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useCompare() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCompare must be used within CompareProvider')
  return c
}
