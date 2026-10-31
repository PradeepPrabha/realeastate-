import { useQuery } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Breadcrumbs, Skeleton } from '@/components/common'
import { useSeo } from '@/hooks/useSeo'
import { publicApi } from '@/services/api'
import PageHero from './PageHero'

export default function Locations() {
  useSeo({ title: 'Property Locations in Tamil Nadu', description: 'Browse properties by district, city and locality across Tamil Nadu.' })
  const locs = useQuery({ queryKey: ['locations'], queryFn: publicApi.locations, staleTime: Infinity })
  const stats = useQuery({ queryKey: ['stats'], queryFn: publicApi.stats })
  const all = locs.data ?? []
  const districts = all.filter((l) => l.type === 'district' && l.active)
  return (
    <>
      <PageHero title="Explore Properties by Location" sub="Browse every district, city and locality across Tamil Nadu." />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Locations' }]} />
        {locs.isLoading ? <Skeleton className="mt-5 h-64" /> : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {districts.map((d) => {
              const cities = all.filter((l) => l.type === 'city' && l.parentId === d.id)
              return (
                <section key={d.id} className="card p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><MapPin className="h-5 w-5 text-gold" />{d.name} District</h2>
                  {cities.map((c) => (
                    <div key={c.id} className="mt-3"><Link to={`/buy?city=${encodeURIComponent(c.name)}`} className="font-semibold text-navy hover:text-gold-600">{c.name} <span className="text-xs font-normal text-slate-500">({stats.data?.byCity[c.name] ?? 0} properties)</span></Link>
                      <div className="mt-1 flex flex-wrap gap-1.5">{all.filter((l) => l.type === 'locality' && l.parentId === c.id).map((l) => <Link key={l.id} to={`/buy?city=${encodeURIComponent(c.name)}&locality=${encodeURIComponent(l.name)}`} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 hover:bg-gold-50 hover:text-gold-700">{l.name}</Link>)}</div></div>
                  ))}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
