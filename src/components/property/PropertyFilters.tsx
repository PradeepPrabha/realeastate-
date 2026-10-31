import { Armchair, Building, Compass, IndianRupee, MapPin, RefreshCw, Ruler, Search, ShieldCheck, Sparkles, BedDouble, Hammer } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { PropertyFilters as F } from '@/types'
import { AMENITY_LIST, CONSTRUCTION_OPTIONS, FACINGS, FURNISHINGS, PROPERTY_TYPES } from '@/utils/constants'

type Patch = Partial<Record<string, string | number | boolean | string[] | undefined>>
interface Props { filters: F; facets?: Record<string, Record<string, number>>; onChange: (p: Patch) => void; onClear: () => void; typeOptions?: string[] }

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <fieldset className="border-b border-slate-100 py-4 first:pt-0"><legend className="mb-2 flex items-center gap-2 text-sm font-bold text-navy"><span className="text-gold">{icon}</span>{title}</legend>{children}</fieldset>
}
function Check({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
  return <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-700"><input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-gold" /><span className="flex-1">{label}</span>{count !== undefined && <span className="text-xs text-slate-400">({count})</span>}</label>
}
const toggle = (arr: string[] | undefined, v: string) => { const a = arr ?? []; return a.includes(v) ? a.filter((x) => x !== v) : [...a, v] }

export default function PropertyFilters({ filters: f, facets, onChange, onClear, typeOptions = PROPERTY_TYPES }: Props) {
  const [moreCity, setMoreCity] = useState(false)
  const [moreAm, setMoreAm] = useState(false)
  const [loc, setLoc] = useState(f.locality ?? '')
  const cities = Object.entries(facets?.city ?? {}).sort((a, b) => b[1] - a[1])
  const selCities = f.city ? f.city.split(',') : []
  const mm = (key: 'Price' | 'Area') => {
    const lo = key === 'Price' ? 'minPrice' : 'minArea', hi = key === 'Price' ? 'maxPrice' : 'maxArea'
    return (
      <div className="grid grid-cols-2 gap-2">
        {[lo, hi].map((k) => <input key={`${k}-${f[k as keyof F] ?? ''}`} type="number" min={0} inputMode="numeric" defaultValue={(f[k as keyof F] as number | undefined) ?? ''} placeholder={k === lo ? `Min ${key}` : `Max ${key}`} aria-label={k === lo ? `Minimum ${key}` : `Maximum ${key}`} onBlur={(e) => { if ((e.target.value || undefined) !== String(f[k as keyof F] ?? '') && (e.target.value || String(f[k as keyof F] ?? ''))) onChange({ [k]: e.target.value || undefined }) }} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="input !px-2 !py-2" />)}
      </div>
    )
  }
  return (
    <div className="card p-4">
      <Section icon={<MapPin className="h-4 w-4" />} title="Location">
        <form onSubmit={(e) => { e.preventDefault(); onChange({ locality: loc.trim() || undefined }) }} className="relative mb-2"><Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={loc} onChange={(e) => setLoc(e.target.value)} onBlur={() => onChange({ locality: loc.trim() || undefined })} placeholder="Search locality" aria-label="Search locality" className="input !py-2 !pl-8" /></form>
        {(moreCity ? cities : cities.slice(0, 5)).map(([c, n]) => <Check key={c} label={c} count={n} checked={selCities.includes(c)} onChange={() => onChange({ city: toggle(selCities, c) })} />)}
        {cities.length > 5 && <button onClick={() => setMoreCity((m) => !m)} className="mt-1 text-xs font-semibold text-gold-600 hover:underline">{moreCity ? '− Show Less' : '+ Show More'}</button>}
      </Section>
      <Section icon={<Building className="h-4 w-4" />} title="Property Type">
        {typeOptions.map((t) => <Check key={t} label={t} count={facets?.type?.[t]} checked={!!f.type?.includes(t)} onChange={() => onChange({ type: toggle(f.type, t) })} />)}
      </Section>
      <Section icon={<IndianRupee className="h-4 w-4" />} title={f.purpose === 'rent' || f.purpose === 'lease' ? 'Rent Range (₹/month)' : 'Budget Range (₹)'}>{mm('Price')}</Section>
      <Section icon={<Ruler className="h-4 w-4" />} title="Area (sq ft)">{mm('Area')}</Section>
      <Section icon={<BedDouble className="h-4 w-4" />} title="Bedrooms">
        {[1, 2, 3, 4, 5].map((n) => <label key={n} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-700"><input type="radio" name="beds" checked={f.bedrooms === n} onChange={() => onChange({ bedrooms: n })} className="accent-gold" /><span className="flex-1">{n === 5 ? '5+ BHK' : `${n} BHK`}</span><span className="text-xs text-slate-400">({facets?.bedrooms?.[String(n)] ?? 0})</span></label>)}
        {f.bedrooms !== undefined && <button onClick={() => onChange({ bedrooms: undefined })} className="mt-1 text-xs font-semibold text-gold-600 hover:underline">Any</button>}
      </Section>
      <Section icon={<Hammer className="h-4 w-4" />} title="Property Status">
        {CONSTRUCTION_OPTIONS.map((o) => <Check key={o.value} label={o.label} count={facets?.construction?.[o.value]} checked={!!f.construction?.includes(o.value)} onChange={() => onChange({ construction: toggle(f.construction, o.value) })} />)}
      </Section>
      <Section icon={<Sparkles className="h-4 w-4" />} title="Amenities">
        {(moreAm ? AMENITY_LIST : AMENITY_LIST.slice(0, 6)).map((a) => <Check key={a} label={a} checked={!!f.amenities?.includes(a)} onChange={() => onChange({ amenities: toggle(f.amenities, a) })} />)}
        <button onClick={() => setMoreAm((m) => !m)} className="mt-1 text-xs font-semibold text-gold-600 hover:underline">{moreAm ? '− Show Less' : '+ Show More'}</button>
      </Section>
      <Section icon={<Compass className="h-4 w-4" />} title="Facing">
        <select aria-label="Facing" value={f.facing ?? ''} onChange={(e) => onChange({ facing: e.target.value || undefined })} className="input !py-2"><option value="">Any facing</option>{FACINGS.map((x) => <option key={x}>{x}</option>)}</select>
      </Section>
      <Section icon={<Armchair className="h-4 w-4" />} title="Furnishing">
        <select aria-label="Furnishing" value={f.furnishing ?? ''} onChange={(e) => onChange({ furnishing: e.target.value || undefined })} className="input !py-2"><option value="">Any</option>{FURNISHINGS.map((x) => <option key={x}>{x}</option>)}</select>
      </Section>
      <Section icon={<ShieldCheck className="h-4 w-4" />} title="Trust">
        <Check label="RERA registered" checked={!!f.rera} onChange={() => onChange({ rera: !f.rera })} />
        <Check label="Verified listings only" checked={!!f.verified} onChange={() => onChange({ verified: !f.verified })} />
      </Section>
      <button onClick={() => { setLoc(''); onClear() }} className="btn mt-4 w-full bg-slate-100 text-navy hover:bg-slate-200"><RefreshCw className="h-4 w-4" />Clear All Filters</button>
    </div>
  )
}
