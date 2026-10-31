import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumbs, EmptyState, Skeleton } from '@/components/common'
import { useDebounce } from '@/hooks/useDebounce'
import { useSeo } from '@/hooks/useSeo'
import { publicApi } from '@/services/api'
import { cx, fmtDate } from '@/utils/format'
import PageHero from './PageHero'

export default function Blog() {
  useSeo({ title: 'Real Estate Insights & News', description: 'Guides, market trends and legal tips for buyers, sellers and investors in Tamil Nadu.' })
  const [cat, setCat] = useState('')
  const [term, setTerm] = useState('')
  const dq = useDebounce(term)
  const all = useQuery({ queryKey: ['blogs'], queryFn: () => publicApi.blogs() })
  const q = useQuery({ queryKey: ['blogs', cat, dq], queryFn: () => publicApi.blogs({ category: cat, q: dq }) })
  const cats = [...new Set((all.data ?? []).map((b) => b.category))]
  return (
    <>
      <PageHero title="Real Estate Insights" sub="Latest news, tips and updates from the Tamil Nadu property market." />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Blog' }]} />
        <div className="my-5 flex flex-wrap items-center gap-2">{['', ...cats].map((c) => <button key={c || 'all'} onClick={() => setCat(c)} aria-pressed={cat === c} className={cx('rounded-full border px-4 py-1.5 text-sm font-medium', cat === c ? 'border-gold bg-gold text-white' : 'border-slate-300 bg-white')}>{c || 'All'}</button>)}<input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search articles" aria-label="Search articles" className="input ml-auto !w-full sm:!w-64" /></div>
        {q.isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-72" />)}</div> : !q.data?.length ? <EmptyState title="No articles found" /> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{q.data.map((b) => (
            <Link key={b.id} to={`/blog/${b.slug}`} className="card group overflow-hidden transition hover:shadow-lift"><img src={b.image} alt="" loading="lazy" className="h-44 w-full object-cover transition group-hover:scale-105" /><div className="p-4"><span className="text-xs font-bold uppercase text-gold-600">{b.category}</span><h2 className="mt-1 text-lg font-bold leading-snug">{b.title}</h2><p className="mt-1 line-clamp-2 text-sm text-slate-500">{b.excerpt}</p><p className="mt-3 text-xs text-slate-400">{fmtDate(b.createdAt)} · {b.author}</p></div></Link>
          ))}</div>
        )}
      </div>
    </>
  )
}
