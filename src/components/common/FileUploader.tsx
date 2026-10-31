import { ArrowLeft, ArrowRight, ImagePlus, Trash2, Star } from 'lucide-react'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

interface Props { label?: string; value: string[]; onChange: (v: string[]) => void; max?: number; maxSizeMb?: number; accept?: string; hint?: string }
const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('read failed')); r.readAsDataURL(f) })

export default function FileUploader({ label = 'Images', value, onChange, max = 12, maxSizeMb = 5, accept = 'image/jpeg,image/png,image/webp', hint }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const add = async (files: FileList | File[]) => {
    const allowed = accept.split(',').map((s) => s.trim())
    const out: string[] = []
    for (const f of Array.from(files)) {
      if (!allowed.includes(f.type)) { toast.error(`${f.name}: unsupported file type`); continue }
      if (f.size > maxSizeMb * 1024 * 1024) { toast.error(`${f.name}: larger than ${maxSizeMb} MB`); continue }
      if (value.length + out.length >= max) { toast.error(`Maximum ${max} files allowed`); break }
      out.push(await readFile(f))
    }
    if (out.length) onChange([...value, ...out])
  }
  const move = (i: number, d: number) => { const n = [...value]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n) }
  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); void add(e.dataTransfer.files) }}
        className={`rounded-xl border-2 border-dashed p-4 transition ${drag ? 'border-gold bg-gold-50' : 'border-slate-300 bg-slate-50'}`}>
        <button type="button" onClick={() => input.current?.click()} className="flex w-full flex-col items-center gap-1 py-3 text-sm text-slate-600">
          <ImagePlus className="h-7 w-7 text-gold" /><span className="font-semibold text-navy">Click to upload or drag and drop</span><span className="text-xs">{hint ?? `JPG, PNG or WebP up to ${maxSizeMb} MB · max ${max} files`}</span>
        </button>
        <input ref={input} type="file" multiple accept={accept} className="hidden" onChange={(e) => { if (e.target.files) void add(e.target.files); e.target.value = '' }} />
        {value.length > 0 && (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {value.map((src, i) => (
              <li key={src.slice(-40) + i} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white">
                <img src={src} alt={`Upload ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-white"><Star className="h-3 w-3" />Cover</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-navy/70 p-1 text-white">
                  <button type="button" aria-label="Move left" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 hover:bg-white/20 disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
                  <button type="button" aria-label="Delete image" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded p-1 hover:bg-red-500"><Trash2 className="h-4 w-4" /></button>
                  <button type="button" aria-label="Move right" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="rounded p-1 hover:bg-white/20 disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
