import { ExternalLink, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TAMIL_NADU_BOUNDS as B } from '@/utils/constants'
import { formatShort, mapsEmbed, mapsLink } from '@/utils/format'

export function PropertyMap({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <iframe title={`Map showing ${title}`} src={mapsEmbed(lat, lng)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-72 w-full border-0" />
      <a href={mapsLink(lat, lng)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 bg-slate-50 py-2 text-sm font-semibold text-navy-500 hover:text-gold-600"><ExternalLink className="h-4 w-4" />Open in Google Maps</a>
    </div>
  )
}

interface Pt { id: number; slug: string; title: string; lat: number; lng: number; price: number }
/** Lightweight location overview: plots listings by coordinates inside Tamil Nadu's bounding box. */
export function MapPoints({ points }: { points: Pt[] }) {
  const x = (lng: number) => ((lng - B.minLng) / (B.maxLng - B.minLng)) * 100
  const y = (lat: number) => (1 - (lat - B.minLat) / (B.maxLat - B.minLat)) * 100
  return (
    <div className="card overflow-hidden">
      <div className="relative h-[480px] bg-gradient-to-b from-navy-50 to-white" role="img" aria-label={`Map of ${points.length} listings across Tamil Nadu`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden><path d="M38 0 L62 3 L86 22 L92 46 L80 70 L62 88 L52 100 L44 92 L32 74 L22 52 L14 30 L24 12 Z" fill="#d9e4f0" stroke="#b3c9e0" strokeWidth=".4" /></svg>
        {points.map((p) => (
          <Link key={p.id} to={`/property/${p.slug}`} title={`${p.title} – ${formatShort(p.price)}`} style={{ left: `${x(p.lng)}%`, top: `${y(p.lat)}%` }} className="group absolute -translate-x-1/2 -translate-y-full">
            <MapPin className="h-6 w-6 fill-gold text-navy drop-shadow transition group-hover:scale-125" />
            <span className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy px-2 py-1 text-xs text-white group-hover:block">{p.title} · {formatShort(p.price)}</span>
          </Link>
        ))}
      </div>
      <p className="border-t px-4 py-2 text-xs text-slate-500">{points.length} listings plotted. Open a property to see its exact location on Google Maps.</p>
    </div>
  )
}
