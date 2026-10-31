import { MessageCircle } from 'lucide-react'
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import CompareBar from '@/components/property/CompareBar'
import { useSettings } from '@/hooks/useSettings'
import { whatsappLink } from '@/utils/format'
import Footer from './Footer'
import Header from './Header'

export default function PublicLayout() {
  const { pathname } = useLocation()
  const s = useSettings()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[200] focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-white">Skip to content</a>
      <Header />
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
      <CompareBar />
      <a href={whatsappLink(s.whatsapp, 'Hello TN HOMES, I would like help finding a property.')} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
        className="fixed bottom-20 right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-105 lg:bottom-6"><MessageCircle className="h-6 w-6" /></a>
    </div>
  )
}
