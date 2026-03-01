'use client'
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line, Legend } from 'recharts'

interface BreachPoint {
  breach_name: string
  breach_date: string
}

interface Props {
  breaches: BreachPoint[]
  forecastNext12Months?: number
}

export default function TimeSeriesAnalysisChart({ breaches, forecastNext12Months = 0 }: Props) {
  const byYear: Record<number, number> = {}
  breaches.forEach((b) => {
    if (!b.breach_date) return
    const year = new Date(b.breach_date).getFullYear()
    if (!Number.isFinite(year)) return
    byYear[year] = (byYear[year] || 0) + 1
  })

  const years = Object.keys(byYear).map((y) => Number(y)).sort((a, b) => a - b)
  if (years.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-600 text-sm font-mono">
        No time-series breach data available
      </div>
    )
  }

  const latestYear = years[years.length - 1]
  let cumulative = 0
  const actual = years.map((year) => {
    const yearly = byYear[year] || 0
    cumulative += yearly
    return {
      year: String(year),
      yearly,
      cumulative,
      forecast: 0,
    }
  })

  const data = [
    ...actual,
    {
      year: `${latestYear + 1} (fc)`,
      yearly: 0,
      cumulative,
      forecast: Math.max(0, Number(forecastNext12Months) || 0),
    },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const row = payload[0]?.payload
    return (
      <div className="bg-[#0e1421] border border-[#1e2d45] rounded-lg p-3 text-xs shadow-xl">
        <p className="font-mono font-bold text-white mb-1">{label}</p>
        <p className="text-gray-300">Yearly breaches: {row?.yearly ?? 0}</p>
        <p className="text-gray-300">Cumulative breaches: {row?.cumulative ?? 0}</p>
        {row?.forecast ? <p className="text-[#ffd166]">Forecast next 12M: {row.forecast}</p> : null}
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
          <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e2d4544' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="yearly" name="Yearly Breaches" fill="#ff3b5cAA" radius={[3, 3, 0, 0]} />
          <Bar yAxisId="left" dataKey="forecast" name="12M Forecast" fill="#ffd166AA" radius={[3, 3, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative" stroke="#4cc9f0" strokeWidth={2} dot={{ r: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
