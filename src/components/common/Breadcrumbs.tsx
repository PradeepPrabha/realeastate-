import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
      <Link to="/" className="flex items-center gap-1 hover:text-gold-600"><Home className="h-4 w-4" />Home</Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5"><ChevronRight className="h-3.5 w-3.5" />{it.to ? <Link to={it.to} className="hover:text-gold-600">{it.label}</Link> : <span className="font-medium text-navy" aria-current="page">{it.label}</span>}</span>
      ))}
    </nav>
  )
}
