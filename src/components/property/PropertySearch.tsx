import { useQuery } from '@tanstack/react-query'
import { Building2, IndianRupee, MapPin, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '@/context/LangContext'
import { publicApi } from '@/services/api'
import { PROPERTY_TYPES, RENT_BUDGETS, SALE_BUDGETS } from '@/utils/constants'
import { cx } from '@/utils/format'

const TABS = [{ id: 'buy', label: 'Buy', path: '/buy' }, { id: 'rent', label: 'Rent', path: '/rent' }, { id: 'lease', label: 'Lease', path: '/rent?purpose=lease' }, { id: 'commercial', label: 'Commercial', path: '/commercial' }] as const
type Tab = (typeof TABS)[number]['id']

export default function PropertySearch({ compact, initialTab = 'buy' }: { compact?: boolean; initialTab?: Tab }) {
  const nav = useNavigate()
  const { t } = useLang()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [location, setLocation] = useState('')
  const [type, setType] = useState('')
  const [budget, setBudget] = useState('')
  const locs = useQuery({ queryKey: ['locations'], queryFn: publicApi.locations, staleTime: Infinity })
  const options = (locs.data ?? []).filter((l) => l.type === 'city' || l.type === 'locality').map((l) => l.name)
  const cities = new Set((locs.data ?? []).filter((l) => l.type === 'city').map((l) => l.name))
  const budgets = tab === 'rent' || tab === 'lease' ? RENT_BUDGETS : SALE_BUDGETS
  const types = tab === 'commercial' ? PROPERTY_TYPES.filter((x) => ['Commercial Property', 'Office Space', 'Shop / Warehouse'].includes(x)) : PROPERTY_TYPES

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const base = TABS.find((x) => x.id === tab)!.path
    const [path, existing] = base.split('?')
    const p = new URLSearchParams(existing)
    const loc = location.trim()
    if (loc) p.set(cities.has(loc) ? 'city' : 'locality', loc)
    if (type) p.set('type', type)
    const b = budgets[Number(budget)]
    if (budget !== '' && b) { if (b.min) p.set('minPrice', String(b.min)); if (b.max) p.set('maxPrice', String(b.max)) }
    nav(`${path}${p.toString() ? `?${p}` : ''}`)
  }
  return (
    <form onSubmit={submit} className={cx('rounded-xl bg-white p-2 shadow-lift', compact ? '' : 'sm:p-3 mt-5')} role="search" aria-label="Search properties">
      <div role="tablist" className="mb-3 flex flex-wrap gap-5 mt-10">
        {TABS.map((x) => <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => { setTab(x.id); setBudget(''); setType('') }} className={cx('rounded-md px-3 py-1.5 text-sm font-semibold transition sm:px-4', tab === x.id ? 'bg-navy text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50')}>{x.label}</button>)}
      </div>
      <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr_auto]">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-gold"><MapPin className="h-5 w-5 shrink-0 text-gold" />
          <span className="min-w-0 flex-1"><span className="block text-[11px] text-slate-500">{t('home') === 'Home' ? 'Location' : 'இடம்'}</span><input list="loc-list" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Select City" aria-label="Location" className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-normal" /></span></label>
        <datalist id="loc-list">{options.map((o) => <option key={o} value={o} />)}</datalist>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-gold"><Building2 className="h-5 w-5 shrink-0 text-gold" />
          <span className="min-w-0 flex-1"><span className="block text-[11px] text-slate-500">Property Type</span><select value={type} onChange={(e) => setType(e.target.value)} aria-label="Property type" className="w-full bg-transparent text-sm font-semibold outline-none"><option value="">Any Type</option>{types.map((x) => <option key={x}>{x}</option>)}</select></span></label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-gold"><IndianRupee className="h-5 w-5 shrink-0 text-gold" />
          <span className="min-w-0 flex-1"><span className="block text-[11px] text-slate-500">{tab === 'rent' || tab === 'lease' ? 'Rent Range' : 'Budget Range'}</span><select value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="Budget" className="w-full bg-transparent text-sm font-semibold outline-none"><option value="">₹ Min - ₹ Max</option>{budgets.map((x, i) => <option key={x.label} value={i}>{x.label}</option>)}</select></span></label>
        <button className="btn-primary !px-8 md:!py-0"><Search className="h-5 w-5" />{t('search')}</button>
      </div>
    </form>
  )
}
