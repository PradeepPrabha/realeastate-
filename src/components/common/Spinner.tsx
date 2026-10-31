import { Loader2 } from 'lucide-react'
export default function Spinner({ full }: { full?: boolean }) {
  return <div className={full ? 'grid min-h-[60vh] place-items-center' : 'grid place-items-center py-10'} role="status" aria-label="Loading"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>
}
