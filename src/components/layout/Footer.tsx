import { useMutation } from '@tanstack/react-query'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Facebook, Instagram, Linkedin, Youtube } from '@/components/common/SocialIcons'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/common'
import { useSettings } from '@/hooks/useSettings'
import { publicApi } from '@/services/api'
import { parseApiError } from '@/services/http'

const quick = [['Home', '/'], ['Buy', '/buy'], ['Rent', '/rent'], ['Commercial', '/commercial'], ['Land & Plots', '/land'], ['Projects', '/projects'], ['Agents', '/agents']]
const support = [['About Us', '/about'], ['Contact Us', '/contact'], ['FAQs', '/faq'], ['Blog', '/blog'], ['Terms & Conditions', '/terms'], ['Privacy Policy', '/privacy'], ['Locations', '/locations']]

export default function Footer() {
  const s = useSettings()
  const [email, setEmail] = useState('')
  const sub = useMutation({ mutationFn: publicApi.newsletter, onSuccess: (r) => { toast.success(r.message); setEmail('') }, onError: (e) => toast.error(parseApiError(e).message) })
  const submit = (e: FormEvent) => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) return void toast.error('Enter a valid email address'); sub.mutate(email) }
  const social = [[Facebook, s.social.facebook, 'Facebook'], [Instagram, s.social.instagram, 'Instagram'], [Youtube, s.social.youtube, 'YouTube'], [Linkedin, s.social.linkedin, 'LinkedIn']] as const
  return (
    <footer className="bg-navy text-slate-300">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed">Your trusted real estate platform for buying, selling and renting properties across Tamil Nadu.</p>
          <div className="mt-4 flex gap-2">{social.map(([Icon, href, label]) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-gold"><Icon className="h-4 w-4" /></a>)}</div>
        </div>
        <div><h3 className="mb-3 text-sm font-bold text-white">Quick Links</h3><ul className="space-y-2 text-sm">{quick.map(([l, to]) => <li key={to}><Link to={to} className="hover:text-gold-300">{l}</Link></li>)}</ul></div>
        <div><h3 className="mb-3 text-sm font-bold text-white">Support</h3><ul className="space-y-2 text-sm">{support.map(([l, to]) => <li key={to}><Link to={to} className="hover:text-gold-300">{l}</Link></li>)}</ul></div>
        <div>
          <h3 className="mb-3 text-sm font-bold text-white">Get in Touch</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{s.address}</li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><a href={`tel:${s.phone.replace(/\s/g, '')}`} className="hover:text-gold-300">{s.phone}</a></li>
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><a href={`mailto:${s.email}`} className="hover:text-gold-300">{s.email}</a></li>
            <li className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{s.hours}</li>
          </ul>
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <h3 className="mb-1 text-sm font-bold text-white">Subscribe to Our Newsletter</h3>
          <p className="mb-3 text-sm">Get the latest property updates and offers.</p>
          <form onSubmit={submit} className="flex overflow-hidden rounded-lg bg-white" noValidate>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" aria-label="Email address" className="min-w-0 flex-1 px-3 py-2.5 text-sm text-brand-ink outline-none" />
            <button disabled={sub.isPending} className="bg-gold px-4 text-sm font-semibold text-white hover:bg-gold-600 disabled:opacity-60">{sub.isPending ? '…' : 'Subscribe'}</button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} TN HOMES. All Rights Reserved.</p>
          <nav className="flex flex-wrap justify-center gap-4" aria-label="Footer">{['Buy', 'Rent', 'Commercial', 'Land & Plots', 'Projects', 'Agents'].map((l, i) => <Link key={l} to={quick[i + 1][1]} className="hover:text-gold-300">{l}</Link>)}</nav>
        </div>
      </div>
    </footer>
  )
}
