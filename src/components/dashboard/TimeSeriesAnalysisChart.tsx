'use client'
import { useState, useEffect } from 'react'
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
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

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
      <div className="h-56 flex items-center justify-center text-[var(--text-muted)] text-sm font-mono">
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

  const tickFill = isDark ? '#9ca3af' : '#6b7280'
  const gridStroke = isDark ? '#374151' : '#e5e7eb'

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const row = payload[0]?.payload
    return (
      <div className="bg-[var(--card-bg)] border border-black/[0.06] dark:border-white/[0.06] rounded-lg p-3 text-xs shadow-xl">
        <p className="font-mono font-bold text-[var(--text)] mb-1">{label}</p>
        <p className="text-[var(--text-muted)]">Yearly breaches: {row?.yearly ?? 0}</p>
        <p className="text-[var(--text-muted)]">Cumulative breaches: {row?.cumulative ?? 0}</p>
        {row?.forecast ? <p className="text-amber-500">Forecast next 12M: {row.forecast}</p> : null}
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis dataKey="year" tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: tickFill, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#ffffff11' : '#37415144' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="yearly" name="Yearly Breaches" fill="#f87171AA" radius={[3, 3, 0, 0]} />
          <Bar yAxisId="left" dataKey="forecast" name="12M Forecast" fill="#fbbf24AA" radius={[3, 3, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative" stroke="#60a5fa" strokeWidth={2} dot={{ r: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
