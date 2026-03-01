'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  breaches: Array<{ breach_name: string; breach_date: string; data_classes: string[]; pwn_count: number }>
}

export default function ReportTimelineChart({ breaches }: Props) {
  const byYear: Record<string, { count: number; names: string[] }> = {}
  breaches.forEach((b) => {
    if (!b.breach_date) return
    const year = new Date(b.breach_date).getFullYear().toString()
    if (!byYear[year]) byYear[year] = { count: 0, names: [] }
    byYear[year].count++
    byYear[year].names.push(b.breach_name)
  })

  const data = Object.entries(byYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, d]) => ({ year, count: d.count, names: d.names.join(', ') }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-200 rounded-md p-3 text-xs shadow-lg">
        <p className="font-mono font-semibold text-[#1f2937] mb-1">{payload[0]?.payload?.year}</p>
        <p className="text-[#dc2626] font-medium">{payload[0]?.value} breach{payload[0]?.value > 1 ? 'es' : ''}</p>
        <p className="text-[#6b7280] mt-1">{payload[0]?.payload?.names}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-[#6b7280] text-sm font-mono">No breach timeline data</div>
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} barCategoryGap="32%">
          {/* original grid stroke: #1e2d45 */}
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="year" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={20} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(220,38,38,0.08)' }} />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={index === data.length - 1 ? '#dc2626' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-5 space-y-2.5">
        {breaches.slice(0, 5).map((b) => (
          <div key={b.breach_name} className="flex items-center gap-3 text-xs">
            <span className="font-mono text-[#6b7280] w-12 text-right">{b.breach_date?.split('-')[0]}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#dc2626] flex-shrink-0" />
            <span className="text-[#1f2937] font-semibold">{b.breach_name}</span>
            <span className="text-[#6b7280] ml-auto">{(b.pwn_count / 1e6).toFixed(0)}M records</span>
          </div>
        ))}
      </div>
    </div>
  )
}
