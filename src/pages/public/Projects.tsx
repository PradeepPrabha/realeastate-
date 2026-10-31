import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumbs, EmptyState, Select, Skeleton } from '@/components/common'
import { useSeo } from '@/hooks/useSeo'
import { publicApi } from '@/services/api'
import { formatShort } from '@/utils/format'
import PageHero from './PageHero'

export default function Projects() {
  useSeo({ title: 'New Projects & Developments in Tamil Nadu', description: 'Explore RERA-registered apartments, villas and plotted developments from top builders in Tamil Nadu.' })
  const [city, setCity] = useState('')
  const [status, setStatus] = useState('')
  const all = useQuery({ queryKey: ['projects'], queryFn: () => publicApi.projects() })
  const q = useQuery({ queryKey: ['projects', city, status], queryFn: () => publicApi.projects({ city, status }) })
  const cities = [...new Set((all.data ?? []).map((p) => p.city))]
  return (
    <>
      <PageHero title="New Projects & Developments" sub="Upcoming and ongoing projects from top builders, with RERA details." image="/images/villa-sunset.webp" />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Projects' }]} />
        <div className="my-5 grid max-w-md grid-cols-2 gap-3"><Select aria-label="City" placeholder="All cities" options={cities} value={city} onChange={(e) => setCity(e.target.value)} /><Select aria-label="Status" placeholder="Any status" options={['New Launch', 'Under Construction', 'Ready to Move']} value={status} onChange={(e) => setStatus(e.target.value)} /></div>
        {q.isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-72" />)}</div> : !q.data?.length ? <EmptyState title="No projects found" message="Try a different city or status." /> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {q.data.map((p) => (
              <Link key={p.id} to={`/projects/${p.slug}`} className="card group overflow-hidden transition hover:shadow-lift">
                <div className="relative"><img src={p.image} alt={p.name} loading="lazy" className="h-44 w-full object-cover transition group-hover:scale-105" /><span className="absolute left-2 top-2 rounded bg-gold px-2 py-0.5 text-[11px] font-bold text-white">{p.tag}</span></div>
                <div className="p-4"><h2 className="text-base font-bold">{p.name}</h2><p className="text-xs text-slate-500">{p.builder} · {p.locality}, {p.city}</p><p className="mt-2 text-sm font-bold text-navy">{formatShort(p.startingPrice)} Onwards</p><p className="text-xs text-slate-500">{p.configurations}</p><span className="mt-2 inline-block rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">{p.status}</span><p className="mt-1 text-[11px] text-slate-400">RERA: {p.rera}</p></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
