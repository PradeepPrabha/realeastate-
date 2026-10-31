import { useQuery } from '@tanstack/react-query'
import { Languages, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Avatar, Breadcrumbs, EmptyState, ErrorState, Rating, Skeleton } from '@/components/common'
import PropertyCard from '@/components/property/PropertyCard'
import { useSeo } from '@/hooks/useSeo'
import { publicApi } from '@/services/api'
import { whatsappLink } from '@/utils/format'

export default function AgentProfile() {
  const { id = '' } = useParams()
  const q = useQuery({ queryKey: ['agent', id], queryFn: () => publicApi.agent(id), retry: false })
  const a = q.data?.agent
  useSeo({ title: a ? `${a.name} – Real Estate Agent in ${a.city}` : 'Agent', description: a?.bio })
  if (q.isLoading) return <div className="container-page py-8"><Skeleton className="h-64" /></div>
  if (q.isError || !a) return <div className="container-page py-16"><ErrorState message="Agent not found." /><div className="mt-4 text-center"><Link to="/agents" className="btn-primary">All agents</Link></div></div>
  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Agents', to: '/agents' }, { label: a.name }]} />
      <div className="card mt-5 flex flex-col gap-5 p-6 sm:flex-row">
        <Avatar name={a.name} className="h-24 w-24 text-3xl" />
        <div className="flex-1"><h1 className="text-2xl font-extrabold">{a.name}</h1><p className="text-slate-600">{a.specialization}</p><div className="mt-1 flex items-center gap-2"><Rating value={a.rating} /><span className="text-sm text-slate-500">{a.rating} rating</span></div><p className="mt-3 max-w-2xl text-sm text-slate-700">{a.bio}</p>
          <ul className="mt-3 grid gap-1.5 text-sm text-slate-600 sm:grid-cols-2"><li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" />{a.city} · {a.experienceYears} years</li><li className="flex items-center gap-2"><Languages className="h-4 w-4 text-gold" />{a.languages.join(', ')}</li>{a.reraId && <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" />RERA Agent: {a.reraId}</li>}<li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" />{a.email}</li></ul></div>
        <div className="flex gap-2 sm:flex-col"><a href={`tel:${a.phone.replace(/\s/g, '')}`} className="btn-primary flex-1"><Phone className="h-4 w-4" />Call</a><a href={whatsappLink(a.whatsapp, `Hi ${a.name}, I found you on TN HOMES.`)} target="_blank" rel="noreferrer" className="btn flex-1 bg-[#25D366] text-white"><MessageCircle className="h-4 w-4" />WhatsApp</a></div>
      </div>
      <h2 className="mb-4 mt-8 text-xl font-extrabold">Properties by {a.name.split(' ')[0]}</h2>
      {q.data!.properties.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{q.data!.properties.map((p) => <PropertyCard key={p.id} p={p} />)}</div> : <EmptyState title="No active listings" message="This agent has no public listings right now." />}
    </div>
  )
}
