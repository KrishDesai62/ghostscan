'use client'
import { ShieldCheck, ShieldAlert } from 'lucide-react'

interface Props {
  scoreBundle: { finalScore: number; level: string; confidence: string; dimensions: any }
  verified: boolean
  breachCount: number
}

export default function RiskOverview({ scoreBundle, verified, breachCount }: Props) {
  const { finalScore, level, confidence } = scoreBundle

  const color = level === 'high' ? '#ef4444' : level === 'moderate' ? '#f59e0b' : '#3b82f6'
  const levelClass = level === 'high' ? 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' : level === 'moderate' ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' : 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'

  const circumference = 2 * Math.PI * 56
  const dashOffset = circumference - (finalScore / 100) * circumference

  const labels: Record<string, string> = { takeover: 'Account Takeover', theft: 'Identity Theft', phishing: 'Phishing', exposure: 'Exposure' }

  return (
    <div className={`gs-card p-8 flex flex-col items-center`}>
      <div className="relative w-44 h-44 mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="56" fill="none" stroke="var(--card-border)" strokeWidth="8" />
          <circle cx="64" cy="64" r="56" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
            filter={`drop-shadow(0 0 6px ${color}66)`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold font-mono leading-none" style={{ color }}>{finalScore}</span>
          <span className="text-sm text-[var(--text-muted)] font-mono mt-1">/100</span>
        </div>
      </div>

      <div className={`px-4 py-1.5 rounded-full text-base font-bold border mb-4 font-mono uppercase tracking-widest ${levelClass}`}>
        {level} Risk
      </div>

      {verified ? (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-bold px-4 py-2 rounded-full mb-5">
          <ShieldCheck className="w-4 h-4" /> Verified Report
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm px-4 py-2 rounded-full mb-5">
          <ShieldAlert className="w-4 h-4" /> Limited Report
        </div>
      )}

      <div className="w-full space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Confidence</span>
          <span className={`font-mono font-bold ${confidence === 'high' ? 'text-blue-500' : confidence === 'medium' ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
            {confidence.toUpperCase()}
          </span>
        </div>
        {Object.entries(scoreBundle.dimensions).map(([key, val]) => {
          const v = val as number
          const barColor = v > 65 ? 'bg-red-400' : v > 35 ? 'bg-amber-400' : 'bg-blue-400'
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-[var(--text-muted)]">{labels[key] || key}</span>
                <span className="font-mono font-bold">{v}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${v}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
