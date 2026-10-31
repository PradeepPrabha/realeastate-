import { useMemo, useState } from 'react'
import { calculateEmi } from '@/utils/emi'
import { formatINR } from '@/utils/format'

export default function EmiCalculator({ price = 5000000 }: { price?: number }) {
  const [amount, setAmount] = useState(Math.round((price * 0.8) / 100000) * 100000 || 2000000)
  const [rate, setRate] = useState(8.75)
  const [years, setYears] = useState(20)
  const r = useMemo(() => calculateEmi(amount, rate, years), [amount, rate, years])
  const pct = r.totalPayment ? Math.round((amount / r.totalPayment) * 100) : 0
  const slider = (id: string, label: string, value: number, set: (n: number) => void, min: number, max: number, step: number, fmt: (n: number) => string) => (
    <div><div className="mb-1 flex justify-between text-xs"><label htmlFor={id} className="font-semibold uppercase tracking-wide text-slate-600">{label}</label><span className="font-bold text-navy">{fmt(value)}</span></div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="w-full accent-gold" /></div>
  )
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-lg font-bold">EMI Calculator</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          {slider('emi-amt', 'Loan amount', amount, setAmount, 100000, Math.max(price, 20000000), 100000, formatINR)}
          {slider('emi-rate', 'Interest rate (p.a.)', rate, setRate, 6, 16, 0.05, (n) => `${n.toFixed(2)}%`)}
          {slider('emi-yrs', 'Tenure', years, setYears, 1, 30, 1, (n) => `${n} years`)}
        </div>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#C9962B ${pct * 3.6}deg, #052442 0)` }} aria-hidden><div className="h-20 w-20 rounded-full bg-white" /></div>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-xs text-slate-500">Monthly EMI</dt><dd className="font-heading text-2xl font-extrabold text-navy">{formatINR(r.emi)}</dd></div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-gold" /><dt className="text-slate-500">Principal</dt><dd className="ml-auto font-semibold">{formatINR(amount)}</dd></div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-navy" /><dt className="text-slate-500">Total interest</dt><dd className="ml-auto font-semibold">{formatINR(r.totalInterest)}</dd></div>
            <div className="flex items-center gap-2 border-t pt-2"><dt className="text-slate-500">Total payable</dt><dd className="ml-auto font-bold">{formatINR(r.totalPayment)}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  )
}
