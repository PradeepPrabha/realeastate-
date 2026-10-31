import { useQuery } from '@tanstack/react-query'
import { publicApi } from '@/services/api'
import type { SiteSettings } from '@/types'

const fallback: SiteSettings = {
  siteName: 'TN HOMES', tagline: 'Properties for a Better Tomorrow', email: 'support@tnhomes.in', phone: '+91 98765 43210', whatsapp: '919876543210', address: 'Coimbatore, Tamil Nadu, India', hours: 'Mon - Sat, 9:00 AM - 6:00 PM',
  requireVerification: true, autoApproveAgentListings: false, listingExpiryDays: 90, gaId: '', mapsKey: '', social: { facebook: 'https://facebook.com', instagram: 'https://instagram.com', youtube: 'https://youtube.com', linkedin: 'https://linkedin.com' },
}
export function useSettings(): SiteSettings {
  const q = useQuery({ queryKey: ['settings'], queryFn: publicApi.settings, staleTime: 10 * 60 * 1000 })
  return q.data ?? fallback
}
