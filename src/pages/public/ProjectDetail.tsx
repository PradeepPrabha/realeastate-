import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, CalendarClock, MapPin } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import { Breadcrumbs, ErrorState, Skeleton } from '@/components/common'
import EnquiryForm from '@/components/property/EnquiryForm'
import PropertyGallery from '@/components/property/PropertyGallery'
import { useSeo } from '@/hooks/useSeo'
import { publicApi } from '@/services/api'
import { formatINR, formatShort } from '@/utils/format'

export default function ProjectDetail() {
  const { slug = '' } = useParams()
  const q = useQuery({ queryKey: ['project', slug], queryFn: () => publicApi.project(slug), retry: false })
  const p = q.data
  useSeo({ title: p ? `${p.name} by ${p.builder}, ${p.city}` : 'Project', description: p?.description, image: p?.image })
  if (q.isLoading) return <div className="container-page py-8"><Skeleton className="h-96" /></div>
  if (q.isError || !p) return <div className="container-page py-16"><ErrorState message="Project not found." /><div className="mt-4 text-center"><Link to="/projects" className="btn-primary">All projects</Link></div></div>
  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Projects', to: '/projects' }, { label: p.name }]} />
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <PropertyGallery images={[p.image, ...p.gallery.filter((g) => g !== p.image)]} title={p.name} />
          <div><span className="rounded bg-gold px-2 py-1 text-xs font-bold text-white">{p.tag}</span><h1 className="mt-2 text-3xl font-extrabold">{p.name}</h1><p className="mt-1 flex items-center gap-1 text-slate-600"><MapPin className="h-4 w-4 text-gold" />{p.locality}, {p.city} · by {p.builder}</p><p className="mt-2 font-heading text-2xl font-extrabold text-navy">{formatShort(p.startingPrice)} Onwards</p></div>
          <div className="grid gap-3 sm:grid-cols-3">{[['Configurations', p.configurations], ['Status', p.status], ['Possession', p.possession]].map(([k, v]) => <div key={k} className="card p-3"><p className="text-xs text-slate-500">{k}</p><p className="flex items-center gap-1 font-bold">{k === 'Possession' && <CalendarClock className="h-4 w-4 text-gold" />}{v}</p></div>)}</div>
          <section className="card p-5"><h2 className="mb-2 text-lg font-bold">About the project</h2><p className="text-sm leading-relaxed text-slate-700">{p.description}</p><p className="mt-3 text-sm">RERA registration: <b>{p.rera}</b></p></section>
          <section className="card overflow-x-auto p-5"><h2 className="mb-3 text-lg font-bold">Unit types & pricing</h2><table className="w-full min-w-[400px] text-sm"><thead className="bg-navy-50 text-left text-xs uppercase text-navy-600"><tr><th className="p-2">Type</th><th className="p-2">Area</th><th className="p-2">Starting price</th></tr></thead><tbody>{p.units.map((u) => <tr key={u.type} className="border-t"><td className="p-2 font-semibold">{u.type}</td><td className="p-2">{u.area}</td><td className="p-2">{formatINR(u.price)}</td></tr>)}</tbody></table></section>
          <section className="card p-5"><h2 className="mb-3 text-lg font-bold">Amenities</h2><ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{p.amenities.map((a) => <li key={a} className="flex items-center gap-2 text-sm"><BadgeCheck className="h-4 w-4 text-brand-green" />{a}</li>)}</ul></section>
        </div>
        <aside><div className="card sticky top-20 p-5"><h2 className="mb-3 text-lg font-bold">Enquire about this project</h2><EnquiryForm /></div></aside>
      </div>
    </div>
  )
}
