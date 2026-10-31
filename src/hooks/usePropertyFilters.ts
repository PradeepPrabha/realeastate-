import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { PropertyFilters } from '@/types'

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : undefined)
const numOrU = (v: string | null) => (v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined)

/** URL query string is the single source of truth for listing filters. */
export function usePropertyFilters(defaults: Partial<PropertyFilters> = {}) {
  const [sp, setSp] = useSearchParams()
  const filters = useMemo<PropertyFilters>(() => ({
    purpose: (sp.get('purpose') as PropertyFilters['purpose']) ?? defaults.purpose, group: defaults.group, type: list(sp.get('type')), city: sp.get('city') ?? undefined, district: sp.get('district') ?? undefined,
    locality: sp.get('locality') ?? undefined, q: sp.get('q') ?? undefined, minPrice: numOrU(sp.get('minPrice')), maxPrice: numOrU(sp.get('maxPrice')), bedrooms: numOrU(sp.get('bedrooms')), bathrooms: numOrU(sp.get('bathrooms')),
    minArea: numOrU(sp.get('minArea')), maxArea: numOrU(sp.get('maxArea')), facing: sp.get('facing') ?? undefined, furnishing: sp.get('furnishing') ?? undefined, construction: list(sp.get('construction')), amenities: list(sp.get('amenities')),
    rera: sp.get('rera') === 'true' || undefined, verified: sp.get('verified') === 'true' || undefined, sort: (sp.get('sort') as PropertyFilters['sort']) ?? 'latest', page: numOrU(sp.get('page')) ?? 1, perPage: 12,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [sp, defaults.purpose, defaults.group])

  const update = useCallback((patch: Partial<Record<string, string | number | boolean | string[] | undefined>>, keepPage = false) => {
    const next = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '' || v === false || (Array.isArray(v) && !v.length)) next.delete(k)
      else next.set(k, Array.isArray(v) ? v.join(',') : String(v))
    }
    if (!keepPage) next.delete('page')
    setSp(next, { replace: false })
  }, [sp, setSp])
  const clear = useCallback(() => { const n = new URLSearchParams(); const p = sp.get('purpose'); if (p) n.set('purpose', p); setSp(n) }, [sp, setSp])
  const activeCount = [...sp.keys()].filter((k) => !['page', 'sort', 'purpose'].includes(k)).length
  return { filters, update, clear, activeCount }
}
