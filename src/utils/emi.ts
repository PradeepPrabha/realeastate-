export interface EmiResult { emi: number; totalInterest: number; totalPayment: number }
export function calculateEmi(principal: number, annualRatePct: number, years: number): EmiResult {
  const n = Math.round(years * 12)
  if (principal <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0 }
  const r = annualRatePct / 12 / 100
  const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  const totalPayment = emi * n
  return { emi, totalInterest: totalPayment - principal, totalPayment }
}
