import { format, formatDistanceToNow, parseISO } from 'date-fns'
import type { Property } from '@/types'

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
export const formatINR = (n: number) => `₹ ${inr.format(Math.round(n))}`
export function formatShort(n: number): string {
  const trim = (v: number) => v.toFixed(2).replace(/\.?0+$/, '')
  if (n >= 1e7) return `₹ ${trim(n / 1e7)} Cr`
  if (n >= 1e5) return `₹ ${trim(n / 1e5)} Lakh`
  return formatINR(n)
}
export const AREA_UNITS: Record<Property['areaUnit'], string> = { sqft: 'sq ft', sqm: 'sq m', cent: 'Cent', acre: 'Acre', ground: 'Ground' }
export const formatArea = (n: number, unit: Property['areaUnit'] = 'sqft') => `${inr.format(n)} ${AREA_UNITS[unit]}`
export function priceLabel(p: Pick<Property, 'purpose' | 'price' | 'rent'>): string {
  if (p.purpose === 'sale') return formatINR(p.price)
  return `${formatINR(p.rent ?? p.price)} / month`
}
export const purposeLabel = (p: Property['purpose']) => ({ sale: 'For Sale', rent: 'For Rent', lease: 'For Lease' })[p]
export const constructionLabel = (c: Property['construction']) => ({ ready: 'Ready to Move', under_construction: 'Under Construction', new_launch: 'New Launch' })[c]
export const fmtDate = (iso: string) => { try { return format(parseISO(iso), 'dd MMM yyyy') } catch { return iso } }
export const fmtDateTime = (iso: string) => { try { return format(parseISO(iso), 'dd MMM yyyy, hh:mm a') } catch { return iso } }
export const timeAgo = (iso: string) => { try { return formatDistanceToNow(parseISO(iso), { addSuffix: true }) } catch { return iso } }
export const titleCase = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
export const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
export const whatsappLink = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
export const mapsEmbed = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`
export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
