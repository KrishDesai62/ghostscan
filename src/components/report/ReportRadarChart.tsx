'use client'
import { Radar, RadarChart as RechartRadar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface Props {
  dimensions: { takeover: number; theft: number; phishing: number; exposure: number }
}

export default function ReportRadarChart({ dimensions }: Props) {
  const data = [
    { subject: 'Account\nTakeover', value: dimensions.takeover, fullMark: 100 },
    { subject: 'Identity\nTheft', value: dimensions.theft, fullMark: 100 },
    { subject: 'Phishing\nRisk', value: dimensions.phishing, fullMark: 100 },
    { subject: 'Public\nExposure', value: dimensions.exposure, fullMark: 100 },
  ]

  return (
    <ResponsiveContainer width="100%" height={270}>
      <RechartRadar data={data} cx="50%" cy="50%" outerRadius="76%">
        {/* original stroke from shared chart: #1e2d45 */}
        <PolarGrid stroke="#c8c2b8" />
        <PolarAngleAxis
          dataKey="subject"
          /* original tick: fill #6b7280, fontSize 11, Space Mono */
          tick={{ fill: '#4b5563', fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
        />
        <Radar
          name="Risk"
          dataKey="value"
          /* original stroke/fill: #ff3b5c */
          stroke="#7b4f2c"
          fill="#7b4f2c"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RechartRadar>
    </ResponsiveContainer>
  )
}
