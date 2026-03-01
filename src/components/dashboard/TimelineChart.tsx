'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  breaches: Array<{ breach_name: string; breach_date: string; data_classes: string[]; pwn_count: number }>
}

export default function TimelineChart({ breaches }: Props) {
  // Group by year
  const byYear: Record<string, { count: number; names: string[] }> = {}
  breaches.forEach(b => {
    if (!b.breach_date) return
    const year = new Date(b.breach_date).getFullYear().toString()
    if (!byYear[year]) byYear[year] = { count: 0, names: [] }
    byYear[year].count++
    byYear[year].names.push(b.breach_name)
  })

  const data = Object.entries(byYear)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([year, d]) => ({ year, count: d.count, names: d.names.join(', ') }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#0e1421] border border-[#1e2d45] rounded-lg p-3 text-xs shadow-xl">
        <p className="font-mono font-bold text-white mb-1">{payload[0]?.payload?.year}</p>
        <p className="text-[#ff3b5c]">{payload[0]?.value} breach{payload[0]?.value > 1 ? 'es' : ''}</p>
        <p className="text-gray-500 mt-1">{payload[0]?.payload?.names}</p>
      </div>
    )
  }

  if (data.length === 0) return (
    <div className="flex items-center justify-center h-48 text-gray-600 text-sm font-mono">No breach timeline data</div>
  )

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
          <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={20} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e2d4544' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={index === data.length - 1 ? '#ff3b5c' : '#ff3b5c88'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Individual breach rows */}
      <div className="mt-4 space-y-2">
        {breaches.slice(0, 5).map(b => (
          <div key={b.breach_name} className="flex items-center gap-3 text-xs">
            <span className="font-mono text-gray-500 w-12 text-right">{b.breach_date?.split('-')[0]}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b5c] flex-shrink-0" />
            <span className="text-gray-300 font-semibold">{b.breach_name}</span>
            <span className="text-gray-600 ml-auto">{(b.pwn_count / 1e6).toFixed(0)}M records</span>
          </div>
        ))}
      </div>
    </div>
  )
}
