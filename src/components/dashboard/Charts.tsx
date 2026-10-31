import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export const COLORS = ['#052442', '#C9962B', '#24558A', '#088E4C', '#0982F9', '#a97a1f', '#7fa3c7', '#865d1a']
export function ChartCard({ title, children, height = 260 }: { title: string; children: React.ReactNode; height?: number }) {
  return <div className="card p-4"><h3 className="mb-3 text-sm font-bold">{title}</h3><div style={{ height }}>{children}</div></div>
}
export function LineSeries({ data, keys, x = 'month' }: { data: object[]; keys: { key: string; color?: string; name?: string }[]; x?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey={x} fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip /><Legend />
      {keys.map((k, i) => <Line key={k.key} type="monotone" dataKey={k.key} name={k.name ?? k.key} stroke={k.color ?? COLORS[i]} strokeWidth={2.5} dot={{ r: 3 }} />)}</LineChart></ResponsiveContainer>
  )
}
export function BarSeries({ data, keys, x = 'name', horizontal }: { data: object[]; keys: { key: string; color?: string; name?: string }[]; x?: string; horizontal?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      {horizontal ? <><XAxis type="number" fontSize={12} allowDecimals={false} /><YAxis type="category" dataKey={x} fontSize={12} width={90} /></> : <><XAxis dataKey={x} fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /></>}
      <Tooltip />{keys.length > 1 && <Legend />}{keys.map((k, i) => <Bar key={k.key} dataKey={k.key} name={k.name ?? k.key} fill={k.color ?? COLORS[i + 1]} radius={[4, 4, 0, 0]} />)}</BarChart></ResponsiveContainer>
  )
}
export function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
  )
}
