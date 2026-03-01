'use client'
import { Radar, RadarChart as RechartRadar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface Props {
  dimensions: { takeover: number; theft: number; phishing: number; exposure: number }
}

export default function RadarChart({ dimensions }: Props) {
  const data = [
    { subject: 'Account\nTakeover', value: dimensions.takeover, fullMark: 100 },
    { subject: 'Identity\nTheft',   value: dimensions.theft,    fullMark: 100 },
    { subject: 'Phishing\nRisk',    value: dimensions.phishing, fullMark: 100 },
    { subject: 'Public\nExposure',  value: dimensions.exposure, fullMark: 100 },
  ]

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RechartRadar data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#1e2d45" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'Space Mono, monospace' }}
        />
        <Radar
          name="Risk"
          dataKey="value"
          stroke="#ff3b5c"
          fill="#ff3b5c"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RechartRadar>
    </ResponsiveContainer>
  )
}
