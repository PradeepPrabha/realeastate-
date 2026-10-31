import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumbs, Skeleton } from '@/components/common'
import { useSeo } from '@/hooks/useSeo'
import { publicApi } from '@/services/api'
import { cx } from '@/utils/format'
import PageHero from './PageHero'

export default function FAQ() {
  const q = useQuery({ queryKey: ['faqs'], queryFn: publicApi.faqs })
  const [open, setOpen] = useState<number | null>(1)
  useSeo({ title: 'Frequently Asked Questions', description: 'Answers about buying, renting, selling and using TN HOMES.', jsonLd: q.data ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: q.data.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) } : undefined })
  const groups = [...new Set((q.data ?? []).map((f) => f.category))]
  return (
    <>
      <PageHero title="Frequently Asked Questions" sub="Everything you need to know about using TN HOMES." />
      <div className="container-page max-w-3xl py-8"><Breadcrumbs items={[{ label: 'FAQ' }]} />
        {q.isLoading ? <Skeleton className="mt-5 h-64" /> : groups.map((g) => (
          <section key={g} className="mt-6"><h2 className="mb-2 text-lg font-bold">{g}</h2><div className="space-y-2">{q.data!.filter((f) => f.category === g).map((f) => (
            <div key={f.id} className="card overflow-hidden"><button aria-expanded={open === f.id} onClick={() => setOpen(open === f.id ? null : f.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold"><span>{f.question}</span><ChevronDown className={cx('h-4 w-4 shrink-0 transition', open === f.id && 'rotate-180')} /></button>{open === f.id && <p className="border-t px-4 py-3 text-sm text-slate-600">{f.answer}</p>}</div>
          ))}</div></section>
        ))}
        <p className="mt-8 text-center text-sm text-slate-600">Still have questions? <Link to="/contact" className="font-semibold text-gold-600">Contact us</Link></p>
      </div>
    </>
  )
}
