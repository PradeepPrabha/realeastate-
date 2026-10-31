import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { cx } from '@/utils/format'

export default function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0)
  const [box, setBox] = useState(false)
  const n = images.length
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n])
  useEffect(() => {
    if (!box) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setBox(false); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }
    document.addEventListener('keydown', h); document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [box, go])
  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-slate-200">
        <button onClick={() => setBox(true)} className="block w-full" aria-label="Open image gallery"><img src={images[i]} alt={`${title} – photo ${i + 1}`} className="aspect-[16/10] w-full object-cover" /></button>
        {n > 1 && <>
          <button onClick={() => go(-1)} aria-label="Previous image" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow hover:bg-white"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => go(1)} aria-label="Next image" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow hover:bg-white"><ChevronRight className="h-5 w-5" /></button>
        </>}
        <button onClick={() => setBox(true)} className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-navy/80 px-3 py-1.5 text-xs font-semibold text-white"><Expand className="h-3.5 w-3.5" />{i + 1} / {n}</button>
      </div>
      {n > 1 && <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">{images.map((s, k) => <button key={s + k} onClick={() => setI(k)} aria-label={`Show photo ${k + 1}`} aria-current={k === i} className={cx('h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2', k === i ? 'border-gold' : 'border-transparent opacity-70 hover:opacity-100')}><img src={s} alt="" loading="lazy" className="h-full w-full object-cover" /></button>)}</div>}
      {box && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Image gallery">
          <button onClick={() => setBox(false)} aria-label="Close gallery" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="h-6 w-6" /></button>
          {n > 1 && <button onClick={() => go(-1)} aria-label="Previous image" className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><ChevronLeft className="h-6 w-6" /></button>}
          <img src={images[i]} alt={`${title} – photo ${i + 1}`} className="max-h-[88vh] max-w-full rounded-lg object-contain" />
          {n > 1 && <button onClick={() => go(1)} aria-label="Next image" className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><ChevronRight className="h-6 w-6" /></button>}
          <p className="absolute bottom-4 text-sm text-white/80">{i + 1} / {n}</p>
        </div>
      )}
    </div>
  )
}
