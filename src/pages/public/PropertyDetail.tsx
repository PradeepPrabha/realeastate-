import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, Bath, BedDouble, Calendar, Car, Compass, FileCheck, Heart, Layers, MapPin, MessageCircle, Phone, Scale, Sofa, Video, View } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar, Breadcrumbs, ErrorState, Modal, Rating, Skeleton } from '@/components/common'
import EmiCalculator from '@/components/property/EmiCalculator'
import EnquiryForm from '@/components/property/EnquiryForm'
import PropertyCard from '@/components/property/PropertyCard'
import PropertyGallery from '@/components/property/PropertyGallery'
import { PropertyMap } from '@/components/property/PropertyMap'
import ShareButton from '@/components/property/ShareButton'
import VisitForm from '@/components/property/VisitForm'
import { useCompare } from '@/context/CompareContext'
import { useFavorites } from '@/hooks/useFavorites'
import { useSeo } from '@/hooks/useSeo'
import { useSettings } from '@/hooks/useSettings'
import { publicApi } from '@/services/api'
import { constructionLabel, cx, formatArea, formatINR, priceLabel, purposeLabel, whatsappLink } from '@/utils/format'

export default function PropertyDetail() {
  const { slug = '' } = useParams()
  const s = useSettings()
  const [tab, setTab] = useState<'enquiry' | 'visit'>('enquiry')
  const [sheet, setSheet] = useState(false)
  const { isFavorite, toggle } = useFavorites()
  const compare = useCompare()
  const q = useQuery({ queryKey: ['property', slug], queryFn: () => publicApi.property(slug), retry: false })
  const p = q.data?.property
  useSeo({
    title: p?.seoTitle ?? (p ? `${p.title} in ${p.locality}, ${p.city}` : 'Property'), description: p?.seoDescription ?? p?.description.slice(0, 160), image: p?.images[0],
    jsonLd: p ? { '@context': 'https://schema.org', '@type': 'RealEstateListing', name: p.title, description: p.description, image: p.images, datePosted: p.createdAt, offers: { '@type': 'Offer', priceCurrency: 'INR', price: p.purpose === 'sale' ? p.price : p.rent }, address: { '@type': 'PostalAddress', addressLocality: p.city, addressRegion: 'Tamil Nadu', postalCode: p.pincode, addressCountry: 'IN' } } : undefined,
  })
  if (q.isLoading) return <div className="container-page space-y-4 py-8"><Skeleton className="h-6 w-64" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-[420px] lg:col-span-2" /><Skeleton className="h-96" /></div></div>
  if (q.isError || !p) return <div className="container-page py-16"><ErrorState message="This property is no longer available or the link is incorrect." /><div className="mt-4 text-center"><Link to="/buy" className="btn-primary">Browse properties</Link></div></div>
  const { similar, agent } = q.data!
  const fav = isFavorite(p.id)
  const facts = [
    p.bedrooms > 0 && { icon: BedDouble, label: 'Bedrooms', value: p.bedrooms }, p.bathrooms > 0 && { icon: Bath, label: 'Bathrooms', value: p.bathrooms }, { icon: Layers, label: 'Built-up area', value: formatArea(p.builtUpArea, p.areaUnit) },
    p.facing && { icon: Compass, label: 'Facing', value: p.facing }, p.group !== 'land' && { icon: Car, label: 'Parking', value: p.parking ? `${p.parking} slot${p.parking > 1 ? 's' : ''}` : 'None' }, p.group !== 'land' && { icon: Sofa, label: 'Furnishing', value: p.furnishing },
  ].filter(Boolean) as { icon: typeof Bath; label: string; value: string | number }[]
  const specs: [string, string | number | undefined][] = [
    ['Property ID', p.code], ['Type', p.type], ['Listing', purposeLabel(p.purpose)], ['Plot area', p.plotArea ? formatArea(p.plotArea, p.areaUnit) : undefined], ['Floor', p.floor !== undefined ? `${p.floor} of ${p.totalFloors}` : p.totalFloors ? `${p.totalFloors} floors` : undefined],
    ['Property age', p.group === 'land' ? undefined : p.ageYears ? `${p.ageYears} years` : 'New'], ['Status', constructionLabel(p.construction)], ['Security deposit', p.deposit ? formatINR(p.deposit) : undefined], ['PIN code', p.pincode], ['District', p.district],
  ]
  const embed = p.videoUrl?.includes('youtube.com/embed')
  return (
    <div className="pb-24 lg:pb-0">
      <div className="container-page py-5"><Breadcrumbs items={[{ label: p.purpose === 'sale' ? 'Buy' : 'Rent', to: p.purpose === 'sale' ? '/buy' : '/rent' }, { label: p.city, to: `/${p.purpose === 'sale' ? 'buy' : 'rent'}?city=${encodeURIComponent(p.city)}` }, { label: p.title }]} /></div>
      <div className="container-page grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <PropertyGallery images={p.images} title={p.title} />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-white"><span className="rounded bg-brand-blue px-2 py-1">{purposeLabel(p.purpose)}</span>{p.featured && <span className="rounded bg-gold px-2 py-1">Featured</span>}{p.verification === 'verified' && <span className="flex items-center gap-1 rounded bg-brand-green px-2 py-1"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>}{p.listing !== 'active' && <span className="rounded bg-purple-600 px-2 py-1 capitalize">{p.listing}</span>}<span className="ml-auto text-slate-500">ID: {p.code}</span></div>
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{p.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-slate-600"><MapPin className="h-4 w-4 text-gold" />{p.address}, {p.pincode}</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3"><p className="font-heading text-3xl font-extrabold text-navy">{priceLabel(p)}</p>
              <div className="flex flex-wrap gap-2"><button onClick={() => toggle(p.id)} aria-pressed={fav} className="btn-ghost border border-slate-300"><Heart className={cx('h-4 w-4', fav && 'fill-red-500 text-red-500')} />{fav ? 'Saved' : 'Save'}</button><button onClick={() => compare.toggle(p.id)} className={cx('btn-ghost border border-slate-300', compare.has(p.id) && '!border-gold !bg-gold-50')}><Scale className="h-4 w-4" />Compare</button><ShareButton title={p.title} /></div></div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{facts.map(({ icon: I, label, value }) => <div key={label} className="card flex items-center gap-3 p-3"><I className="h-6 w-6 text-gold" /><div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-bold">{value}</p></div></div>)}</div>
          <section className="card p-5"><h2 className="mb-2 text-lg font-bold">Description</h2><p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{p.description}</p></section>
          <section className="card p-5"><h2 className="mb-3 text-lg font-bold">Property Specifications</h2><dl className="grid gap-x-8 sm:grid-cols-2">{specs.filter(([, v]) => v !== undefined).map(([k, v]) => <div key={k} className="flex justify-between border-b border-slate-100 py-2 text-sm"><dt className="text-slate-500">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl></section>
          {p.amenities.length > 0 && <section className="card p-5"><h2 className="mb-3 text-lg font-bold">Amenities</h2><ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{p.amenities.map((a) => <li key={a} className="flex items-center gap-2 text-sm"><BadgeCheck className="h-4 w-4 text-brand-green" />{a}</li>)}</ul></section>}
          {p.floorPlans.length > 0 && <section className="card p-5"><h2 className="mb-3 text-lg font-bold">Floor Plans</h2><div className="grid gap-3 sm:grid-cols-2">{p.floorPlans.map((f) => <img key={f} src={f} alt={`Floor plan of ${p.title}`} loading="lazy" className="rounded-lg border" />)}</div></section>}
          {(p.videoUrl || p.tourUrl) && <section className="card p-5"><h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Video className="h-5 w-5 text-gold" />Video & Virtual Tour</h2>{embed && <iframe title={`Video tour of ${p.title}`} src={p.videoUrl} loading="lazy" allowFullScreen className="aspect-video w-full rounded-lg" />}{p.tourUrl && <a href={p.tourUrl} target="_blank" rel="noreferrer" className="btn-outline mt-3"><View className="h-4 w-4" />Open 360° tour</a>}</section>}
          {(p.rera || p.verification) && <section className="card p-5"><h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><FileCheck className="h-5 w-5 text-gold" />Verification & RERA</h2><ul className="space-y-1 text-sm"><li>Verification status: <span className={cx('font-semibold capitalize', p.verification === 'verified' ? 'text-brand-green' : 'text-amber-600')}>{p.verification}</span></li>{p.rera ? <li>RERA registration: <span className="font-semibold">{p.rera}</span></li> : <li className="text-slate-500">RERA registration not applicable or not provided.</li>}</ul></section>}
          <section><h2 className="mb-3 text-lg font-bold">Location</h2><PropertyMap lat={p.lat} lng={p.lng} title={p.title} /></section>
          <EmiCalculator price={p.purpose === 'sale' ? p.price : p.price || 5000000} />
          {similar.length > 0 && <section><h2 className="mb-3 text-lg font-bold">Similar Properties</h2><div className="grid gap-5 sm:grid-cols-2">{similar.slice(0, 4).map((x) => <PropertyCard key={x.id} p={x} />)}</div></section>}
        </div>
        <aside className="hidden lg:block"><div className="sticky top-20 space-y-4">
          {agent && <div className="card flex items-center gap-3 p-4"><Avatar name={agent.name} className="h-14 w-14 text-lg" /><div className="min-w-0 flex-1"><Link to={`/agents/${agent.id}`} className="font-bold hover:text-gold-600">{agent.name}</Link><p className="text-xs text-slate-500">{agent.specialization}</p><Rating value={agent.rating} className="h-3.5 w-3.5" /></div><a href={`tel:${agent.phone.replace(/\s/g, '')}`} aria-label={`Call ${agent.name}`} className="grid h-10 w-10 place-items-center rounded-full bg-navy text-white"><Phone className="h-4 w-4" /></a></div>}
          <div className="card p-5">
            <div role="tablist" className="mb-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-semibold">{(['enquiry', 'visit'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx('rounded-md py-2', tab === t ? 'bg-white shadow' : 'text-slate-600')}>{t === 'enquiry' ? 'Send Enquiry' : 'Schedule Visit'}</button>)}</div>
            {tab === 'enquiry' ? <EnquiryForm property={p} /> : <VisitForm property={p} />}
          </div>
        </div></aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1fr_auto] gap-2 border-t bg-white p-3 shadow-lift lg:hidden">
        <button onClick={() => setSheet(true)} className="btn-primary"><Calendar className="h-4 w-4" />Enquire / Visit</button>
        <a href={`tel:${(agent?.phone ?? s.phone).replace(/\s/g, '')}`} className="btn-navy"><Phone className="h-4 w-4" />Call</a>
        <a href={whatsappLink(s.whatsapp, `Hi, I am interested in ${p.title} (${p.code}).`)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="btn bg-[#25D366] text-white"><MessageCircle className="h-5 w-5" /></a>
      </div>
      <Modal open={sheet} onClose={() => setSheet(false)} title="Contact agent">
        <div role="tablist" className="mb-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-semibold">{(['enquiry', 'visit'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx('rounded-md py-2', tab === t ? 'bg-white shadow' : 'text-slate-600')}>{t === 'enquiry' ? 'Send Enquiry' : 'Schedule Visit'}</button>)}</div>
        {tab === 'enquiry' ? <EnquiryForm property={p} onDone={() => setSheet(false)} /> : <VisitForm property={p} onDone={() => setSheet(false)} />}
      </Modal>
    </div>
  )
}
