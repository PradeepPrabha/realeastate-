import { Share2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ShareButton({ title, className }: { title: string; className?: string }) {
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title, url })
      else { await navigator.clipboard.writeText(url); toast.success('Link copied to clipboard') }
    } catch { /* user cancelled */ }
  }
  return <button onClick={() => void share()} className={className ?? 'btn-ghost border border-slate-300'}><Share2 className="h-4 w-4" />Share</button>
}
