'use client'
import { useState, useEffect } from 'react'
import { Radar, RadarChart as RechartRadar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface Props {
  dimensions: { takeover: number; theft: number; phishing: number; exposure: number }
}

export default function RadarChart({ dimensions }: Props) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const data = [
    { subject: 'Account\nTakeover', value: dimensions.takeover, fullMark: 100 },
    { subject: 'Identity\nTheft',   value: dimensions.theft,    fullMark: 100 },
    { subject: 'Phishing\nRisk',    value: dimensions.phishing, fullMark: 100 },
    { subject: 'Public\nExposure',  value: dimensions.exposure, fullMark: 100 },
  ]

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RechartRadar data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke={isDark ? '#374151' : '#d1d5db'} />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11, fontFamily: 'Space Mono, monospace' }}
        />
        <Radar
          name="Risk"
          dataKey="value"
          stroke="#f87171"
          fill="#f87171"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RechartRadar>
    </ResponsiveContainer>
  )
}
