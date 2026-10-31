import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { Breadcrumbs, EmptyState, Skeleton } from '@/components/common'
import { useCompare } from '@/context/CompareContext'
import { useSeo } from '@/hooks/useSeo'
import { publicApi } from '@/services/api'
import type { Property } from '@/types'
import { constructionLabel, formatArea, priceLabel, purposeLabel } from '@/utils/format'

export default function Compare({ embedded }: { embedded?: boolean }) {
  useSeo({ title: 'Compare Properties' })
  const { ids, remove, clear } = useCompare()
  const q = useQuery({ queryKey: ['compare', ids], queryFn: () => publicApi.compare(ids), enabled: ids.length > 0 })
  const rows: [string, (p: Property) => string | number][] = [
    ['Price', priceLabel], ['Listing', (p) => purposeLabel(p.purpose)], ['Type', (p) => p.type], ['Location', (p) => `${p.locality}, ${p.city}`], ['Area', (p) => formatArea(p.builtUpArea, p.areaUnit)], ['Bedrooms', (p) => p.bedrooms || '—'], ['Bathrooms', (p) => p.bathrooms || '—'],
    ['Facing', (p) => p.facing || '—'], ['Furnishing', (p) => p.furnishing], ['Parking', (p) => p.parking], ['Status', (p) => constructionLabel(p.construction)], ['RERA', (p) => p.rera ?? '—'], ['Verified', (p) => (p.verification === 'verified' ? 'Yes' : 'No')], ['Amenities', (p) => p.amenities.length],
  ]
  const list = (q.data ?? []).filter((p) => ids.includes(p.id))
  return (
    <div className={embedded ? '' : 'container-page py-8'}>
      {!embedded && <Breadcrumbs items={[{ label: 'Compare Properties' }]} />}
      <div className="my-4 flex items-center justify-between"><h1 className="text-2xl font-extrabold">Compare Properties</h1>{ids.length > 0 && <button onClick={clear} className="text-sm font-semibold text-red-600">Clear all</button>}</div>
      {!ids.length ? <EmptyState title="No properties selected" message="Use the compare icon on any property card to add up to four properties." action={<Link to="/buy" className="btn-primary">Browse properties</Link>} /> : q.isLoading ? <Skeleton className="h-96" /> : (
        <div className="card overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead><tr><th className="w-36 bg-navy-50 p-3" />{list.map((p) => <th key={p.id} className="relative min-w-52 p-3 text-left align-top"><button onClick={() => remove(p.id)} aria-label={`Remove ${p.title}`} className="absolute right-2 top-2 rounded-full bg-slate-100 p-1 hover:bg-red-100"><X className="h-3.5 w-3.5" /></button><img src={p.images[0]} alt="" className="mb-2 h-28 w-full rounded-lg object-cover" /><Link to={`/property/${p.slug}`} className="font-bold hover:text-gold-600">{p.title}</Link></th>)}</tr></thead>
          <tbody>{rows.map(([label, fn]) => <tr key={label} className="border-t border-slate-100"><th scope="row" className="bg-navy-50 p-3 text-left text-xs font-semibold uppercase text-navy-600">{label}</th>{list.map((p) => <td key={p.id} className="p-3">{fn(p)}</td>)}</tr>)}</tbody>
        </table></div>
      )}
    </div>
  )
}
