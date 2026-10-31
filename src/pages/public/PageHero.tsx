import type { ReactNode } from 'react'
export default function PageHero({ title, sub, image = '/images/villa-blue.webp', children }: { title: string; sub?: string; image?: string; children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy">
      <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" />
      <div className="container-page py-12 sm:py-16"><h1 className="text-3xl font-extrabold !text-white sm:text-4xl">{title}</h1>{sub && <p className="mt-2 max-w-2xl text-slate-200">{sub}</p>}{children}</div>
    </section>
  )
}
