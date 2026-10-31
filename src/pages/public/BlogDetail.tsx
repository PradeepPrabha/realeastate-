import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumbs, ErrorState, Skeleton } from '@/components/common'
import ShareButton from '@/components/property/ShareButton'
import { useSeo } from '@/hooks/useSeo'
import { publicApi } from '@/services/api'
import { fmtDate } from '@/utils/format'

export default function BlogDetail() {
  const { slug = '' } = useParams()
  const q = useQuery({ queryKey: ['blog', slug], queryFn: () => publicApi.blog(slug), retry: false })
  const b = q.data?.blog
  useSeo({ title: b?.title ?? 'Article', description: b?.excerpt, image: b?.image, jsonLd: b ? { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: b.title, datePublished: b.createdAt, author: { '@type': 'Organization', name: b.author } } : undefined })
  if (q.isLoading) return <div className="container-page max-w-3xl py-8"><Skeleton className="h-96" /></div>
  if (q.isError || !b) return <div className="container-page py-16"><ErrorState message="Article not found." /><div className="mt-4 text-center"><Link to="/blog" className="btn-primary">All articles</Link></div></div>
  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Blog', to: '/blog' }, { label: b.title }]} />
      <article className="mx-auto mt-5 max-w-3xl"><span className="text-xs font-bold uppercase text-gold-600">{b.category}</span><h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{b.title}</h1><p className="mt-2 text-sm text-slate-500">{fmtDate(b.createdAt)} · {b.author}</p>
        <img src={b.image} alt="" className="my-5 w-full rounded-xl object-cover" /><div className="space-y-4 leading-relaxed text-slate-700">{b.content.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}</div><div className="mt-6"><ShareButton title={b.title} /></div></article>
      <section className="mx-auto mt-12 max-w-5xl"><h2 className="mb-4 text-xl font-extrabold">Related articles</h2><div className="grid gap-4 sm:grid-cols-3">{q.data!.related.map((r) => <Link key={r.id} to={`/blog/${r.slug}`} className="card overflow-hidden transition hover:shadow-lift"><img src={r.image} alt="" loading="lazy" className="h-32 w-full object-cover" /><h3 className="p-3 text-sm font-bold">{r.title}</h3></Link>)}</div></section>
    </div>
  )
}
