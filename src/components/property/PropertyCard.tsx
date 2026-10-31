import { Bath, BedDouble, Building2, Heart, MapPin, Maximize, Scale } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCompare } from '@/context/CompareContext'
import { useFavorites } from '@/hooks/useFavorites'
import type { Property } from '@/types'
import { constructionLabel, cx, formatArea, priceLabel, purposeLabel } from '@/utils/format'
import EnquiryModal from './EnquiryModal'

export default function PropertyCard({ p, list }: { p: Property; list?: boolean }) {
  const { isFavorite, toggle } = useFavorites()
  const compare = useCompare()
  const [contact, setContact] = useState(false)
  const fav = isFavorite(p.id)
  const badge = 'rounded px-2 py-0.5 text-[11px] font-bold text-white shadow'
  return (
    <article className={cx('card group overflow-hidden transition hover:shadow-lift', list && 'sm:flex')}>
      <div className={cx('relative overflow-hidden', list ? 'sm:w-72 sm:shrink-0' : '')}>
        <Link to={`/property/${p.slug}`} aria-label={`View ${p.title}`}>
          <img src={p.images[0]} alt={p.title} loading="lazy" className={cx('w-full object-cover transition duration-500 group-hover:scale-105', list ? 'h-52 sm:h-full' : 'h-48')} />
        </Link>
        <div className="absolute left-2 top-2 flex gap-1.5">
          {p.featured && <span className={cx(badge, 'bg-gold')}>Featured</span>}
          {p.verification === 'verified' && <span className={cx(badge, 'bg-brand-green')}>Verified</span>}
          {p.isNew && !p.featured && <span className={cx(badge, 'bg-brand-blue')}>New</span>}
        </div>
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <button onClick={() => toggle(p.id)} aria-pressed={fav} aria-label={fav ? 'Remove from favorites' : 'Save to favorites'} className="grid h-8 w-8 place-items-center rounded-full bg-white shadow hover:scale-110"><Heart className={cx('h-4 w-4', fav ? 'fill-red-500 text-red-500' : 'text-slate-600')} /></button>
          <button onClick={() => compare.toggle(p.id)} aria-pressed={compare.has(p.id)} aria-label="Compare property" className={cx('grid h-8 w-8 place-items-center rounded-full shadow hover:scale-110', compare.has(p.id) ? 'bg-gold text-white' : 'bg-white text-slate-600')}><Scale className="h-4 w-4" /></button>
        </div>
        <span className={cx(badge, 'absolute bottom-2 left-2 bg-brand-blue')}>{purposeLabel(p.purpose)}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-base font-bold"><Link to={`/property/${p.slug}`} className="hover:text-gold-600">{p.title}</Link></h3>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5 shrink-0 text-gold" /><span className="line-clamp-1">{p.locality}, {p.city}</span></p>
        <p className="mt-2 font-heading text-lg font-extrabold text-navy">{priceLabel(p)}</p>
        <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          <li className="flex items-center gap-1"><Maximize className="h-4 w-4 text-slate-400" />{formatArea(p.builtUpArea, p.areaUnit)}</li>
          {p.bedrooms > 0 && <li className="flex items-center gap-1" title="Bedrooms"><BedDouble className="h-4 w-4 text-slate-400" />{p.bedrooms}</li>}
          {p.bathrooms > 0 && <li className="flex items-center gap-1" title="Bathrooms"><Bath className="h-4 w-4 text-slate-400" />{p.bathrooms}</li>}
        </ul>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"><Building2 className="h-3 w-3" />{p.type}</span>
          <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs text-green-700">{constructionLabel(p.construction)}</span>
          {p.listing === 'sold' && <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">Sold</span>}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <Link to={`/property/${p.slug}`} className="btn-primary !px-3">View Details →</Link>
          <button onClick={() => setContact(true)} className="btn-outline !px-3">Contact</button>
        </div>
      </div>
      <EnquiryModal open={contact} onClose={() => setContact(false)} property={p} />
    </article>
  )
}
