import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { Button, FileUploader, Input, Select, Textarea } from '@/components/common'
import { publicApi } from '@/services/api'
import { parseApiError } from '@/services/http'
import type { Agent, Property } from '@/types'
import { AMENITY_LIST, AREA_UNIT_OPTIONS, CONSTRUCTION_OPTIONS, FACINGS, FURNISHINGS, PROPERTY_TYPES, TYPE_GROUP } from '@/utils/constants'

const numStr = z.string().refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Enter a valid number')
const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'), description: z.string().min(20, 'Describe the property in at least 20 characters'),
  purpose: z.enum(['sale', 'rent', 'lease']), type: z.string().min(1, 'Select a property type'),
  price: numStr, rent: numStr, deposit: numStr, district: z.string().min(1, 'Select a district'), city: z.string().min(1, 'Select a city'), locality: z.string().min(2, 'Enter a locality'),
  address: z.string().min(5, 'Enter the full address'), pincode: z.string().regex(/^\d{6}$/, 'Enter a 6-digit PIN code'), lat: numStr, lng: numStr,
  bedrooms: numStr, bathrooms: numStr, builtUpArea: z.string().min(1, 'Enter the area').pipe(numStr), plotArea: numStr, areaUnit: z.string(), facing: z.string(), furnishing: z.string(),
  floor: numStr, totalFloors: numStr, parking: numStr, ageYears: numStr, construction: z.string(), amenities: z.array(z.string()), images: z.array(z.string()).min(1, 'Upload at least one image'),
  floorPlans: z.array(z.string()), documents: z.array(z.string()), videoUrl: z.string().url('Enter a valid URL').or(z.literal('')), tourUrl: z.string().url('Enter a valid URL').or(z.literal('')),
  rera: z.string(), featured: z.boolean(), seoTitle: z.string().max(70, 'Max 70 characters'), seoDescription: z.string().max(170, 'Max 170 characters'),
  agentId: z.string(), verification: z.string(), listing: z.string(),
}).superRefine((v, ctx) => {
  if (v.purpose === 'sale' && !(Number(v.price) > 0)) ctx.addIssue({ code: 'custom', path: ['price'], message: 'Price is required for sale listings' })
  if (v.purpose !== 'sale' && !(Number(v.rent) > 0)) ctx.addIssue({ code: 'custom', path: ['rent'], message: 'Monthly rent is required' })
})
type Values = z.infer<typeof schema>

const s = (n: number | undefined) => (n === undefined || n === null ? '' : String(n))
const toValues = (p?: Property): Values => ({
  title: p?.title ?? '', description: p?.description ?? '', purpose: p?.purpose ?? 'sale', type: p?.type ?? '', price: s(p?.price), rent: s(p?.rent), deposit: s(p?.deposit), district: p?.district ?? '', city: p?.city ?? '', locality: p?.locality ?? '',
  address: p?.address ?? '', pincode: p?.pincode ?? '', lat: s(p?.lat), lng: s(p?.lng), bedrooms: s(p?.bedrooms), bathrooms: s(p?.bathrooms), builtUpArea: s(p?.builtUpArea), plotArea: s(p?.plotArea), areaUnit: p?.areaUnit ?? 'sqft',
  facing: p?.facing ?? '', furnishing: p?.furnishing ?? 'Unfurnished', floor: s(p?.floor), totalFloors: s(p?.totalFloors), parking: s(p?.parking), ageYears: s(p?.ageYears), construction: p?.construction ?? 'ready', amenities: p?.amenities ?? [],
  images: p?.images ?? [], floorPlans: p?.floorPlans ?? [], documents: [], videoUrl: p?.videoUrl ?? '', tourUrl: p?.tourUrl ?? '', rera: p?.rera ?? '', featured: p?.featured ?? false, seoTitle: p?.seoTitle ?? '', seoDescription: p?.seoDescription ?? '',
  agentId: s(p?.agentId), verification: p?.verification ?? 'pending', listing: p?.listing ?? 'active',
})
const n = (v: string) => (v === '' ? undefined : Number(v))

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card p-5"><h3 className="mb-4 border-b border-slate-100 pb-2 text-base font-bold">{title}</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div></section>
}

interface Props { mode: 'admin' | 'agent'; property?: Property; agents?: Agent[]; onSubmit: (body: Record<string, unknown>) => Promise<unknown>; submitLabel?: string }
export default function PropertyForm({ mode, property, agents = [], onSubmit, submitLabel = 'Save Property' }: Props) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(property) })
  const locs = useQuery({ queryKey: ['locations'], queryFn: publicApi.locations, staleTime: Infinity })
  const [district, city, purpose, type] = useWatch({ control, name: ['district', 'city', 'purpose', 'type'] })
  const all = locs.data ?? []
  const districts = all.filter((l) => l.type === 'district')
  const cities = all.filter((l) => l.type === 'city' && l.parentId === districts.find((d) => d.name === district)?.id)
  const cityRow = all.find((l) => l.type === 'city' && l.name === city && l.parentId === districts.find((d) => d.name === district)?.id)
  const localities = all.filter((l) => l.type === 'locality' && l.parentId === cityRow?.id)
  const isLand = TYPE_GROUP[type] === 'land'
  const isHome = ['Apartment', 'Independent House', 'Villa'].includes(type)
  const m = useMutation({
    mutationFn: (v: Values) => onSubmit({
      ...v, group: TYPE_GROUP[v.type], price: n(v.price) ?? 0, rent: n(v.rent), deposit: n(v.deposit), lat: n(v.lat), lng: n(v.lng), bedrooms: n(v.bedrooms) ?? 0, bathrooms: n(v.bathrooms) ?? 0,
      builtUpArea: n(v.builtUpArea) ?? 0, plotArea: n(v.plotArea), floor: n(v.floor), totalFloors: n(v.totalFloors), parking: n(v.parking) ?? 0, ageYears: n(v.ageYears) ?? 0, agentId: n(v.agentId),
      ...(mode === 'agent' ? { verification: undefined, listing: undefined, agentId: undefined } : {}),
    }),
    onError: (e) => toast.error(parseApiError(e).message),
  })
  const err = (k: keyof Values) => errors[k]?.message as string | undefined
  const onInvalid = () => toast.error('Please fix the highlighted fields')
  return (
    <form onSubmit={handleSubmit((v) => m.mutate(v), onInvalid)} className="space-y-5" noValidate>
      <Section title="Basic information">
        <Input wrapperClassName="lg:col-span-2" label="Property title" required placeholder="e.g. 3 BHK Independent House" error={err('title')} {...register('title')} />
        <Input label="Property ID" value={property?.code ?? 'Auto-generated'} readOnly disabled />
        <Select label="Listing purpose" required options={[{ value: 'sale', label: 'Sale' }, { value: 'rent', label: 'Rent' }, { value: 'lease', label: 'Lease' }]} {...register('purpose')} />
        <Select label="Property type" required placeholder="Select type" options={PROPERTY_TYPES} error={err('type')} {...register('type')} />
        <Input label="Category" value={TYPE_GROUP[type] ? TYPE_GROUP[type][0].toUpperCase() + TYPE_GROUP[type].slice(1) : '—'} readOnly disabled />
        <Textarea wrapperClassName="sm:col-span-2 lg:col-span-3" label="Description" required rows={5} error={err('description')} {...register('description')} />
      </Section>
      <Section title="Pricing">
        {purpose === 'sale' ? <Input label="Price (₹)" required type="number" min={0} error={err('price')} {...register('price')} /> : <>
          <Input label="Monthly rent (₹)" required type="number" min={0} error={err('rent')} {...register('rent')} />
          <Input label="Security deposit (₹)" type="number" min={0} error={err('deposit')} {...register('deposit')} />
          <Input label="Reference price (₹)" type="number" min={0} hint="Optional market value" error={err('price')} {...register('price')} />
        </>}
      </Section>
      <Section title="Location">
        <Select label="District" required placeholder="Select district" options={districts.map((d) => d.name)} error={err('district')} {...register('district', { onChange: () => { setValue('city', ''); setValue('pincode', '') } })} />
        <Select label="City" required placeholder="Select city" options={cities.map((c) => c.name)} disabled={!district} error={err('city')} {...register('city', { onChange: (e) => { const c = all.find((l) => l.type === 'city' && l.name === e.target.value); if (c?.pincode) setValue('pincode', c.pincode) } })} />
        <div><Input label="Locality" required list="localities" error={err('locality')} {...register('locality')} /><datalist id="localities">{localities.map((l) => <option key={l.id} value={l.name} />)}</datalist></div>
        <Input wrapperClassName="sm:col-span-2" label="Full address" required error={err('address')} {...register('address')} />
        <Input label="PIN code" required inputMode="numeric" maxLength={6} error={err('pincode')} {...register('pincode')} />
        <Input label="Latitude" type="number" step="any" error={err('lat')} {...register('lat')} />
        <Input label="Longitude" type="number" step="any" error={err('lng')} {...register('lng')} />
      </Section>
      <Section title="Specifications">
        {isHome && <><Input label="Bedrooms" type="number" min={0} error={err('bedrooms')} {...register('bedrooms')} /><Input label="Bathrooms" type="number" min={0} error={err('bathrooms')} {...register('bathrooms')} /></>}
        <Input label={isLand ? 'Plot / land area' : 'Built-up area'} required type="number" step="any" min={0} error={err('builtUpArea')} {...register('builtUpArea')} />
        {!isLand && <Input label="Plot area" type="number" step="any" min={0} error={err('plotArea')} {...register('plotArea')} />}
        <Select label="Area unit" options={AREA_UNIT_OPTIONS} {...register('areaUnit')} />
        <Select label="Facing" placeholder="Select facing" options={FACINGS} {...register('facing')} />
        {!isLand && <Select label="Furnishing" options={FURNISHINGS} {...register('furnishing')} />}
        {type === 'Apartment' && <><Input label="Floor number" type="number" min={0} {...register('floor')} /><Input label="Total floors" type="number" min={0} {...register('totalFloors')} /></>}
        {!isLand && <Input label="Parking (slots)" type="number" min={0} {...register('parking')} />}
        <Select label="Construction status" options={CONSTRUCTION_OPTIONS} {...register('construction')} />
        {!isLand && <Input label="Property age (years)" type="number" min={0} {...register('ageYears')} />}
        <Input label="RERA registration number" placeholder="TN/01/2026/1234" {...register('rera')} />
      </Section>
      <section className="card p-5">
        <h3 className="mb-3 border-b border-slate-100 pb-2 text-base font-bold">Amenities</h3>
        <Controller control={control} name="amenities" render={({ field }) => (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{AMENITY_LIST.map((a) => <label key={a} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-gold" checked={field.value.includes(a)} onChange={() => field.onChange(field.value.includes(a) ? field.value.filter((x) => x !== a) : [...field.value, a])} />{a}</label>)}</div>
        )} />
      </section>
      <section className="card space-y-5 p-5">
        <h3 className="border-b border-slate-100 pb-2 text-base font-bold">Media and documents</h3>
        <Controller control={control} name="images" render={({ field }) => <><FileUploader label="Property images (first image is the cover)" value={field.value} onChange={field.onChange} />{err('images') && <p role="alert" className="text-xs font-medium text-red-600">{err('images')}</p>}</>} />
        <Controller control={control} name="floorPlans" render={({ field }) => <FileUploader label="Floor plans" value={field.value} onChange={field.onChange} max={4} />} />
        <div className="grid gap-4 sm:grid-cols-2"><Input label="Property video URL (YouTube embed)" error={err('videoUrl')} {...register('videoUrl')} /><Input label="360° virtual tour URL" error={err('tourUrl')} {...register('tourUrl')} /></div>
        <Controller control={control} name="documents" render={({ field }) => <FileUploader label="Supporting documents (private – never shown publicly)" value={field.value} onChange={field.onChange} max={6} accept="image/jpeg,image/png,image/webp" hint="Patta, chitta, EC or approval copies. Stored privately; visible only to admin." />} />
      </section>
      <Section title="Publishing and SEO">
        {mode === 'admin' && <>
          <Select label="Assigned agent" required placeholder="Select agent" options={agents.map((a) => ({ value: a.id, label: a.name }))} {...register('agentId')} />
          <Select label="Verification status" options={[{ value: 'pending', label: 'Pending' }, { value: 'verified', label: 'Verified' }, { value: 'rejected', label: 'Rejected' }]} {...register('verification')} />
          <Select label="Listing status" options={['draft', 'active', 'inactive', 'sold', 'rented', 'expired'].map((x) => ({ value: x, label: x[0].toUpperCase() + x.slice(1) }))} {...register('listing')} />
        </>}
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-gold" {...register('featured')} />Featured listing</label>
        <Input wrapperClassName="sm:col-span-2" label="SEO title" error={err('seoTitle')} {...register('seoTitle')} />
        <Textarea wrapperClassName="sm:col-span-2 lg:col-span-3" label="SEO description" rows={2} error={err('seoDescription')} {...register('seoDescription')} />
      </Section>
      {mode === 'agent' && <p className="rounded-lg bg-gold-50 p-3 text-sm text-gold-700">New listings are submitted for admin verification and become public only after approval.</p>}
      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"><Button type="submit" loading={m.isPending}>{submitLabel}</Button></div>
    </form>
  )
}

