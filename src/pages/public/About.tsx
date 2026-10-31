import { BadgeCheck, Eye, Handshake, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/common'
import { useSeo } from '@/hooks/useSeo'
import PageHero from './PageHero'

export default function About() {
  useSeo({ title: 'About Us', description: 'TN HOMES is a Tamil Nadu focused real estate platform with verified listings, trusted agents and transparent information.' })
  return (
    <>
      <PageHero title="About TN HOMES" sub="Properties for a Better Tomorrow – built for Tamil Nadu." />
      <div className="container-page space-y-10 py-8">
        <Breadcrumbs items={[{ label: 'About Us' }]} />
        <section className="grid items-center gap-8 md:grid-cols-2"><div><h2 className="section-title">Tamil Nadu's trusted property partner</h2><p className="mt-3 text-slate-600">TN HOMES brings buyers, sellers, tenants, landlords and developers together on one verified platform. From apartments in Chennai and villas in Coimbatore to DTCP-approved plots and agricultural land, every listing is reviewed by our team before it goes live.</p><p className="mt-3 text-slate-600">We combine local expertise with modern technology — transparent pricing, RERA details, site-visit booking and dedicated agents — so you can decide with confidence.</p><Link to="/contact" className="btn-primary mt-5">Talk to our team</Link></div><img src="/images/villa-sunset.webp" alt="Modern villas at sunset" className="rounded-2xl shadow-lift" loading="lazy" /></section>
        <section className="grid gap-4 md:grid-cols-3">{[[Target, 'Our Mission', 'Make buying, selling and renting property in Tamil Nadu simple, safe and transparent.'], [Eye, 'Our Vision', 'To be the most trusted real estate platform in South India.'], [Handshake, 'Our Values', 'Honesty, verification, customer-first service and respect for every deal.']].map(([I, t, d]) => { const Icon = I as typeof Target; return <div key={t as string} className="card p-6"><Icon className="mb-3 h-8 w-8 text-gold" /><h3 className="text-lg font-bold">{t as string}</h3><p className="mt-1 text-sm text-slate-600">{d as string}</p></div> })}</section>
        <section className="rounded-2xl bg-navy p-8 text-white"><h2 className="text-2xl font-extrabold !text-white">Why customers choose us</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{['Every listing reviewed and verified', 'Experienced local agents in every major city', 'Clear pricing with no hidden charges', 'Help with documentation and site visits'].map((x) => <li key={x} className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-gold" />{x}</li>)}</ul></section>
      </div>
    </>
  )
}
