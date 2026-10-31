import { useQuery } from '@tanstack/react-query'
import { Briefcase, MapPin, Phone } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Breadcrumbs, EmptyState, Rating, Skeleton } from '@/components/common'
import { useDebounce } from '@/hooks/useDebounce'
import { useSeo } from '@/hooks/useSeo'
import { publicApi } from '@/services/api'
import PageHero from './PageHero'

export default function Agents() {
  useSeo({ title: 'Real Estate Agents in Tamil Nadu', description: 'Meet experienced, verified real estate agents across Chennai, Coimbatore, Madurai and more.' })
  const [term, setTerm] = useState('')
  const dq = useDebounce(term)
  const q = useQuery({ queryKey: ['agents', dq], queryFn: () => publicApi.agents({ q: dq }) })
  return (
    <>
      <PageHero title="Our Real Estate Agents" sub="Work with experienced and professional agents who know Tamil Nadu's markets." />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Agents' }]} />
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search by name, city or specialization" aria-label="Search agents" className="input my-5 max-w-md" />
        {q.isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-48" />)}</div> : !q.data?.length ? <EmptyState title="No agents found" /> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{q.data.map((a) => (
            <article key={a.id} className="card p-5"><div className="flex items-center gap-3"><Avatar name={a.name} className="h-16 w-16 text-xl" /><div><h2 className="text-lg font-bold">{a.name}</h2><Rating value={a.rating} className="h-3.5 w-3.5" /></div></div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600"><li className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-gold" />{a.specialization}</li><li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" />{a.city} · {a.experienceYears} yrs experience</li></ul>
              <div className="mt-4 grid grid-cols-2 gap-2"><Link to={`/agents/${a.id}`} className="btn-primary">View Profile</Link><a href={`tel:${a.phone.replace(/\s/g, '')}`} className="btn-outline"><Phone className="h-4 w-4" />Call</a></div></article>
          ))}</div>
        )}
      </div>
    </>
  )
}
