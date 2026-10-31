import { Star } from 'lucide-react'
export default function Rating({ value, className = 'h-4 w-4' }: { value: number; className?: string }) {
  return <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${className} ${i <= Math.round(value) ? 'fill-gold text-gold' : 'text-slate-300'}`} />)}</span>
}
