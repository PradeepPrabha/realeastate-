import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BadgeCheck, Briefcase, Building2, FileText, Gem, Headphones, Landmark, MapPin, Quote, ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CardGridSkeleton, Rating } from '@/components/common'
import PropertyCard from '@/components/property/PropertyCard'
import PropertySearch from '@/components/property/PropertySearch'
import { useLang } from '@/context/LangContext'
import { useSeo } from '@/hooks/useSeo'
import { publicApi } from '@/services/api'
import { formatShort, fmtDate } from '@/utils/format'

function Head({ title, sub, to, label = 'View All' }: { title: string; sub?: string; to?: string; label?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div><h2 className="section-title">{title}</h2>{sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}</div>
      {to && <Link to={to} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-navy hover:text-gold-600">{label}<ArrowRight className="h-4 w-4" /></Link>}
    </div>
  )
}
const QUICK = [['Apartments', '/buy?type=Apartment'], ['Independent Houses', '/buy?type=Independent House'], ['Villas', '/buy?type=Villa'], ['Plots', '/land'], ['Commercial Spaces', '/commercial']]
const WHY = [
  { icon: ShieldCheck, title: 'Verified Property Listings', text: 'All properties are verified for genuine and reliable information.' },
  { icon: Users, title: 'Trusted Real Estate Agents', text: 'Work with experienced and professional agents.' },
  { icon: FileText, title: 'Transparent Property Information', text: 'Clear details, legal information and no hidden charges.' },
  { icon: Headphones, title: 'Dedicated Customer Support', text: 'Get expert assistance at every step of your journey.' },
]
const SERVICES = [
  { icon: Building2, title: 'Buy & Sell', text: 'End-to-end support for residential and commercial transactions.' }, { icon: Landmark, title: 'Legal & Documentation', text: 'Title checks, patta/chitta guidance and registration help.' },
  { icon: Briefcase, title: 'Property Management', text: 'Tenant sourcing, rent collection and maintenance for owners.' }, { icon: Gem, title: 'Investment Consulting', text: 'Data-backed advice on plots, rentals and upcoming corridors.' },
]
const CITY_IMG = ['/images/villa-blue.webp', '/images/villa-sunset.webp', '/images/ph-apartment.svg', '/images/ph-commercial.svg']

export default function Home() {
  const { t } = useLang()
  useSeo({ title: 'TN HOMES – Find Your Perfect Property in Tamil Nadu', description: 'Search verified residential, commercial and land properties for sale and rent across Chennai, Coimbatore, Madurai and all of Tamil Nadu.', jsonLd: { '@context': 'https://schema.org', '@type': 'RealEstateAgent', name: 'TN HOMES', areaServed: 'Tamil Nadu, India' } })
  const cats = useQuery({ queryKey: ['categories'], queryFn: publicApi.categories })
  const featured = useQuery({ queryKey: ['featured'], queryFn: publicApi.featured })
  const latest = useQuery({ queryKey: ['latest'], queryFn: publicApi.latest })
  const stats = useQuery({ queryKey: ['stats'], queryFn: publicApi.stats })
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => publicApi.projects() })
  const reviews = useQuery({ queryKey: ['testimonials'], queryFn: publicApi.testimonials })
  const blogs = useQuery({ queryKey: ['blogs'], queryFn: () => publicApi.blogs() })
  const cities = Object.entries(stats.data?.byCity ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy">
        <img src="/images/villa-blue.webp" alt="" fetchPriority="high" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/90 via-navy/50 to-transparent" />
        <div className="container-page py-14 sm:py-20 lg:py-24">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight !text-white sm:text-5xl">{t('heroTitle')}</h1>
          <p className="mt-3 max-w-xl text-lg text-slate-100">{t('heroSub')}</p>
          <div className="mt-8 max-w-4xl"><PropertySearch /></div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white"><span className="font-semibold">Quick Search:</span>{QUICK.map(([l, to]) => <Link key={l} to={to} className="rounded-md bg-white/15 px-3 py-1 backdrop-blur hover:bg-gold">{l}</Link>)}</div>
          <Link to="/buy?type=Villa&city=Coimbatore" className="mt-8 hidden w-fit items-center gap-3 rounded-lg bg-navy/70 p-3 text-white backdrop-blur md:flex"><MapPin className="h-6 w-6 text-gold" /><span><span className="block font-bold">Premium Villas in Coimbatore</span><span className="text-xs text-slate-300">Modern Living, Better Tomorrow</span></span></Link>
        </div>
      </section>

      <section className="container-page py-10">
        <Head title="Popular Property Categories" sub="Explore a wide range of properties across Tamil Nadu." to="/buy" label="View All Categories" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {(cats.data ?? []).map((c) => (
            <Link key={c.id} to={`/${c.group === 'land' ? 'land' : c.group === 'commercial' ? 'commercial' : 'buy'}?type=${encodeURIComponent(c.name)}`} className="card group overflow-hidden transition hover:shadow-lift">
              <img src={c.image} alt={c.name} loading="lazy" className="h-24 w-full object-cover transition group-hover:scale-105" />
              <div className="p-3"><h3 className="text-sm font-bold leading-tight">{c.name}</h3><p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{c.description}</p><span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-gold-600">Explore <ArrowRight className="h-3 w-3" /></span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page py-8">
        <Head title="Featured Properties" sub="Handpicked properties in prime locations across Tamil Nadu." to="/buy" label="View All Properties" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.isLoading ? <CardGridSkeleton /> : (featured.data ?? []).slice(0, 4).map((p) => <PropertyCard key={p.id} p={p} />)}</div>
      </section>

      <section className="container-page py-8">
        <Head title="Explore Properties by Location" sub="Find properties in top cities across Tamil Nadu." to="/locations" label="View All Locations" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {cities.map(([c, n], i) => (
            <Link key={c} to={`/buy?city=${encodeURIComponent(c)}`} className="group relative h-36 overflow-hidden rounded-xl">
              <img src={CITY_IMG[i % CITY_IMG.length]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
              <div className="absolute bottom-0 p-3 text-white"><p className="font-bold">{c}</p><p className="text-xs text-slate-200">{n}+ Properties</p></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-navy-50 py-10">
        <div className="container-page">
          <Head title="Why Choose Us?" sub="Your trusted real estate partner in Tamil Nadu." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{WHY.map(({ icon: I, title, text }) => <div key={title} className="card flex gap-3 p-4"><I className="h-9 w-9 shrink-0 text-gold" /><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs text-slate-500">{text}</p></div></div>)}</div>
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-navy p-6 text-center text-white md:grid-cols-4">
            {[[`${stats.data?.properties ?? 0}+`, 'Verified Properties'], [`${stats.data?.agents ?? 0}+`, 'Expert Agents'], [`${stats.data?.cities ?? 0}+`, 'Cities Covered'], [`${stats.data?.customers ?? 0}+`, 'Happy Customers']].map(([v, l]) => <div key={l}><p className="font-heading text-3xl font-extrabold text-gold-300">{v}</p><p className="text-xs text-slate-300">{l}</p></div>)}
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <Head title="Latest Properties" sub="Newly listed homes, plots and commercial spaces." to="/buy?sort=latest" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{latest.isLoading ? <CardGridSkeleton /> : (latest.data ?? []).slice(0, 4).map((p) => <PropertyCard key={p.id} p={p} />)}</div>
      </section>

      <section className="container-page py-6">
        <Head title="New Projects and Developments" sub="Explore upcoming and ongoing projects from top builders." to="/projects" label="View All Projects" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(projects.data ?? []).slice(0, 4).map((p) => (
            <Link key={p.id} to={`/projects/${p.slug}`} className="card group overflow-hidden transition hover:shadow-lift">
              <div className="relative"><img src={p.image} alt={p.name} loading="lazy" className="h-40 w-full object-cover transition group-hover:scale-105" /><span className="absolute left-2 top-2 rounded bg-gold px-2 py-0.5 text-[11px] font-bold text-white">{p.tag}</span></div>
              <div className="p-4"><h3 className="font-bold">{p.name}</h3><p className="text-xs text-slate-500">{p.builder} · {p.locality}, {p.city}</p><p className="mt-2 text-sm font-bold text-navy">{formatShort(p.startingPrice)} Onwards</p><p className="text-xs text-slate-500">{p.configurations}</p>
                <span className="mt-2 inline-block rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">{p.status}</span><p className="mt-1 text-[11px] text-slate-400">RERA: {p.rera}</p></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page py-8">
        <Head title="Our Services" sub="More than listings — complete real estate support." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{SERVICES.map(({ icon: I, title, text }) => <div key={title} className="card p-5"><div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gold-50 text-gold-600"><I className="h-6 w-6" /></div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm text-slate-500">{text}</p></div>)}</div>
      </section>

      <section className="relative isolate my-6 overflow-hidden bg-navy">
        <img src="/images/villa-sunset.webp" alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
        <div className="container-page grid items-center gap-6 py-12 md:grid-cols-2">
          <div><p className="text-xs font-bold uppercase tracking-widest text-gold-300">Exclusive Collection</p><h2 className="mt-1 text-3xl font-extrabold !text-white">Premium Properties</h2><p className="mt-2 max-w-md text-slate-200">Discover our handpicked collection of luxury homes, premium villas and high-value properties in the best locations.</p><Link to="/buy?type=Villa&minPrice=10000000" className="btn-primary mt-5">Explore Premium Properties →</Link></div>
          <ul className="grid grid-cols-2 gap-3 text-sm font-semibold text-white">{['Luxury Homes', 'Prime Locations', 'Best Investment', 'Exclusive Listings'].map((x) => <li key={x} className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-gold" />{x}</li>)}</ul>
        </div>
      </section>

      <section className="container-page py-4">
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-navy-50 p-5 sm:flex-row"><div className="flex items-center gap-3"><Building2 className="h-10 w-10 text-gold" /><div><h2 className="text-xl font-extrabold">Sell or Rent Your Property</h2><p className="text-sm text-slate-600">Reach thousands of genuine buyers and tenants across Tamil Nadu.</p></div></div><Link to="/sell" className="btn-primary">List Your Property →</Link></div>
      </section>

      <section className="container-page grid gap-8 py-10 lg:grid-cols-2">
        <div>
          <Head title="What Our Customers Say" sub="Real people. Real experiences." />
          <div className="space-y-3">{(reviews.data ?? []).slice(0, 3).map((r) => <figure key={r.id} className="card p-5"><Quote className="mb-2 h-6 w-6 text-gold" /><blockquote className="text-sm text-slate-700">“{r.text}”</blockquote><figcaption className="mt-3 flex items-center justify-between"><span><span className="block text-sm font-bold">{r.name}</span><span className="text-xs text-slate-500">{r.city}</span></span><Rating value={r.rating} /></figcaption></figure>)}</div>
        </div>
        <div>
          <Head title="Real Estate Insights" sub="Latest news, tips and updates from the Tamil Nadu market." to="/blog" label="View All Articles" />
          <div className="space-y-3">{(blogs.data ?? []).slice(0, 3).map((b) => <Link key={b.id} to={`/blog/${b.slug}`} className="card flex gap-3 p-3 transition hover:shadow-lift"><img src={b.image} alt="" loading="lazy" className="h-20 w-28 shrink-0 rounded-lg object-cover" /><div className="min-w-0"><h3 className="line-clamp-2 text-sm font-bold">{b.title}</h3><p className="mt-1 text-xs text-slate-500">{fmtDate(b.createdAt)} · {b.category}</p></div></Link>)}</div>
        </div>
      </section>
    </>
  )
}
