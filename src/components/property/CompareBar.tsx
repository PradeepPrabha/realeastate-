import { Scale, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCompare } from '@/context/CompareContext'

export default function CompareBar() {
  const { ids, clear } = useCompare()
  if (!ids.length) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold bg-navy px-4 py-3 text-white shadow-lift">
      <div className="container-page flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold"><Scale className="h-5 w-5 text-gold" />{ids.length} of 4 properties selected to compare</p>
        <div className="flex items-center gap-2"><Link to="/compare" className="btn-primary !py-2">Compare now</Link><button onClick={clear} aria-label="Clear comparison" className="rounded-lg p-2 hover:bg-white/10"><X className="h-5 w-5" /></button></div>
      </div>
    </div>
  )
}
