import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/common'

export default function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-navy lg:block">
        <img src="/images/villa-blue.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Logo />
          <div><h2 className="font-heading text-4xl font-extrabold !text-white">Find Your Perfect Property in Tamil Nadu.</h2><p className="mt-3 max-w-md text-slate-200">Verified listings, trusted agents and a smooth journey from search to site visit.</p></div>
        </div>
      </div>
      <div className="flex flex-col justify-center px-4 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 lg:hidden"><div className="inline-block rounded-lg bg-navy px-3 py-2"><Logo /></div></div>
          <h1 className="text-3xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
          <p className="mt-8 text-center text-xs text-slate-400"><Link to="/" className="hover:text-gold-600">← Back to TN HOMES</Link></p>
        </div>
      </div>
    </div>
  )
}
