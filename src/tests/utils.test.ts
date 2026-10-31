import { describe, expect, it } from 'vitest'
import { calculateEmi } from '@/utils/emi'
import { formatINR, formatShort, priceLabel } from '@/utils/format'

describe('EMI calculator', () => {
  it('matches the standard amortisation formula', () => {
    const r = calculateEmi(5_000_000, 8.5, 20)
    expect(Math.round(r.emi)).toBe(43391)
    expect(Math.round(r.totalPayment)).toBe(Math.round(r.emi * 240))
  })
  it('handles zero interest and invalid input', () => {
    expect(calculateEmi(120000, 0, 1).emi).toBe(10000)
    expect(calculateEmi(0, 8, 10).emi).toBe(0)
  })
})
describe('formatting', () => {
  it('uses Indian digit grouping', () => { expect(formatINR(7500000)).toBe('₹ 75,00,000') })
  it('abbreviates to Lakh / Cr', () => { expect(formatShort(6500000)).toBe('₹ 65 Lakh'); expect(formatShort(25000000)).toBe('₹ 2.5 Cr') })
  it('labels rent per month', () => { expect(priceLabel({ purpose: 'rent', price: 0, rent: 45000 })).toBe('₹ 45,000 / month') })
})
