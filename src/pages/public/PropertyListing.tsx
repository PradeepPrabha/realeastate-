import { useQuery } from '@tanstack/react-query'
import { Bell, LayoutGrid, List, Map, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Breadcrumbs, CardGridSkeleton, EmptyState, ErrorState, Pagination, PropertyCardSkeleton } from '@/components/common'
import PropertyCard from '@/components/property/PropertyCard'
import PropertyFilters from '@/components/property/PropertyFilters'
import { MapPoints } from '@/components/property/PropertyMap'
import PropertySearch from '@/components/property/PropertySearch'
import { useAuth } from '@/context/AuthContext'
import { usePropertyFilters } from '@/hooks/usePropertyFilters'
import { useSeo } from '@/hooks/useSeo'
import { customerApi, publicApi } from '@/services/api'
import { parseApiError } from '@/services/http'
import type { CategoryGroup, Purpose } from '@/types'
import { PROPERTY_TYPES, SORT_OPTIONS } from '@/utils/constants'
import { cx } from '@/utils/format'

interface Preset { title: string; heading: string; sub: string; purpose?: Purpose; group?: CategoryGroup; image: string; tab: 'buy' | 'rent' | 'commercial'; types?: string[] }
export const PRESETS: Record<string, Preset> = {
  buy: { title: 'Buy Properties', heading: 'Buy Properties', sub: 'Explore verified residential, commercial and land properties for sale across Tamil Nadu.', purpose: 'sale', image: '/images/villa-blue.webp', tab: 'buy' },
  rent: { title: 'Rent Properties', heading: 'Rental Properties', sub: 'Find homes, offices and shops for rent and lease across Tamil Nadu.', purpose: 'rent', image: '/images/villa-sunset.webp', tab: 'rent' },
  commercial: { title: 'Commercial Properties', heading: 'Commercial Properties', sub: 'Offices, shops, showrooms and warehouses for sale and rent.', group: 'commercial', image: '/images/ph-commercial.svg', tab: 'commercial', types: ['Commercial Property', 'Office Space', 'Shop / Warehouse'] },
  land: { title: 'Land & Plots', heading: 'Land & Plots Portal', sub: 'DTCP approved plots, residential layouts and agricultural land in Tamil Nadu.', group: 'land', image: '/images/ph-plot.svg', tab: 'buy', types: ['Residential Plot', 'Agricultural Land'] },
}
const POPULAR = [['2 BHK in Chennai', '?bedrooms=2&city=Chennai'], ['3 BHK in Coimbatore', '?bedrooms=3&city=Coimbatore'], ['Villas', '?type=Villa'], ['Plots in Coimbatore', '?city=Coimbatore&type=Residential Plot'], ['Independent House in Madurai', '?type=Independent House&city=Madurai']]

export default function PropertyListing({ preset }: { preset: keyof typeof PRESETS }) {
  const cfg = PRESETS[preset]
  const { user } = useAuth()
  const { filters, update, clear, activeCount } = usePropertyFilters({ purpose: cfg.purpose, group: cfg.group })
  const [view, setView] = useState<'grid' | 'list' | 'map'>('grid')
  const [drawer, setDrawer] = useState(false)
  const loc = filters.city ? ` in ${filters.city}` : ''
  useSeo({ title: `${cfg.title}${loc}`, description: cfg.sub })
  const q = useQuery({ queryKey: ['properties', filters], queryFn: () => publicApi.properties(filters), placeholderData: (prev) => prev })
  const map = useQuery({ queryKey: ['map', { ...filters, page: undefined }], queryFn: () => publicApi.mapPoints({ ...filters, page: undefined }), enabled: view === 'map' })
  const meta = q.data?.meta
  const from = meta ? (meta.page - 1) * meta.perPage + 1 : 0
  const saveAlert = async () => {
    if (user?.role !== 'customer') return void toast('Log in with a customer account to create property alerts')
    try { await customerApi.addAlert({ label: `${cfg.title}${loc}`, query: window.location.search.slice(1) || 'all', frequency: 'daily' }); toast.success('Alert saved. We will notify you about new matches.') } catch (e) { toast.error(parseApiError(e).message) }
  }
  const filterPanel = <PropertyFilters filters={filters} facets={meta?.facets} typeOptions={cfg.types ?? PROPERTY_TYPES} onChange={(p) => update(p)} onClear={clear} />
  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy">
        <img src={cfg.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
        <div className="container-page py-10 sm:py-14"><h1 className="text-3xl font-extrabold !text-white sm:text-4xl">{cfg.heading}</h1><p className="mt-2 max-w-2xl text-slate-200">{cfg.sub}</p></div>
      </section>
      <div className="bg-white shadow-sm"><div className="container-page -mt-6 pb-4"><PropertySearch compact initialTab={cfg.tab} />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold text-slate-600">Popular Searches:</span>{POPULAR.map(([l, qs]) => <Link key={l} to={`${preset === 'land' || preset === 'commercial' ? '/buy' : ''}${qs}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs hover:border-gold">{l}</Link>)}</div></div></div>
      <div className="container-page py-6">
        <Breadcrumbs items={[{ label: cfg.title }]} />
        <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block" aria-label="Filters">{filterPanel}</aside>
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600" aria-live="polite">{meta ? (meta.total ? <>Showing <b>{from} – {Math.min(meta.page * meta.perPage, meta.total)}</b> of <b>{meta.total.toLocaleString('en-IN')}</b> properties{loc}</> : 'No properties found') : 'Loading properties…'}</p>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setDrawer(true)} className="btn-outline lg:hidden"><SlidersHorizontal className="h-4 w-4" />Filters{activeCount > 0 && ` (${activeCount})`}</button>
                <button onClick={() => void saveAlert()} className="btn-ghost hidden border border-slate-300 sm:inline-flex"><Bell className="h-4 w-4" />Save alert</button>
                <label className="flex items-center gap-2 text-sm"><span className="hidden text-slate-600 sm:inline">Sort By</span><select value={filters.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort by" className="input !w-auto !py-2">{SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
                <div className="flex overflow-hidden rounded-lg border border-slate-300" role="group" aria-label="View mode">
                  {([['grid', LayoutGrid, 'Grid view'], ['list', List, 'List view'], ['map', Map, 'Map view']] as const).map(([v, I, l]) => <button key={v} onClick={() => setView(v)} aria-label={l} aria-pressed={view === v} className={cx('grid h-9 w-9 place-items-center', view === v ? 'bg-navy text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}><I className="h-4 w-4" /></button>)}
                </div>
              </div>
            </div>
            {activeCount > 0 && <div className="mb-3 flex flex-wrap gap-2">{Object.entries({ City: filters.city, Locality: filters.locality, Type: filters.type?.join(', '), Beds: filters.bedrooms ? `${filters.bedrooms} BHK` : undefined, 'Min ₹': filters.minPrice, 'Max ₹': filters.maxPrice, Search: filters.q }).filter(([, v]) => v).map(([k, v]) => <span key={k} className="rounded-full bg-gold-50 px-3 py-1 text-xs font-medium text-gold-700">{k}: {v}</span>)}<button onClick={clear} className="flex items-center gap-1 text-xs font-semibold text-red-600"><X className="h-3 w-3" />Clear</button></div>}
            {view === 'map' ? (map.data ? <MapPoints points={map.data} /> : <div className="skeleton h-[480px] rounded-xl" />) : q.isError ? <ErrorState onRetry={() => void q.refetch()} message={parseApiError(q.error).message} /> : q.isLoading ? (
              <div className={cx('grid gap-5', view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : '')}>{view === 'grid' ? <CardGridSkeleton count={6} /> : Array.from({ length: 4 }, (_, i) => <PropertyCardSkeleton key={i} list />)}</div>
            ) : q.data && q.data.data.length ? (
              <div className={cx('grid gap-5', view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : '', q.isPlaceholderData && 'opacity-60 transition')}>{q.data.data.map((p) => <PropertyCard key={p.id} p={p} list={view === 'list'} />)}</div>
            ) : <EmptyState title="No properties match your search" message="Try removing a few filters or searching a nearby location." action={<button onClick={clear} className="btn-primary">Clear all filters</button>} />}
            {view !== 'map' && meta && <Pagination className="mt-8" page={meta.page} lastPage={meta.lastPage} onChange={(p) => { update({ page: p }, true); window.scrollTo({ top: 300, behavior: 'smooth' }) }} />}
          </div>
        </div>
      </div>
      {drawer && (
        <div className="fixed inset-0 z-[90] lg:hidden"><div className="absolute inset-0 bg-navy/60" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-brand-bg"><div className="flex items-center justify-between border-b bg-white px-4 py-3"><h2 className="font-bold">Filters</h2><button onClick={() => setDrawer(false)} aria-label="Close filters"><X className="h-5 w-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-3">{filterPanel}</div><div className="border-t bg-white p-3"><button onClick={() => setDrawer(false)} className="btn-primary w-full">Show {meta?.total ?? ''} properties</button></div></div></div>
      )}
    </>
  )
}
