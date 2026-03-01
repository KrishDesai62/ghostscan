'use client'
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react'

interface Props {
  scoreBundle: { finalScore: number; level: string; confidence: string; dimensions: any }
  verified: boolean
  breachCount: number
}

export default function RiskOverview({ scoreBundle, verified, breachCount }: Props) {
  const { finalScore, level, confidence } = scoreBundle

  const color = level === 'high' ? '#ff3b5c' : level === 'moderate' ? '#ffd166' : '#00ff9d'
  const bg    = level === 'high' ? '#ff3b5c11' : level === 'moderate' ? '#ffd16611' : '#00ff9d11'
  const border= level === 'high' ? '#ff3b5c33' : level === 'moderate' ? '#ffd16633' : '#00ff9d33'

  const circumference = 2 * Math.PI * 52
  const dashOffset    = circumference - (finalScore / 100) * circumference

  return (
    <div className="gs-card p-6 flex flex-col items-center" style={{ borderColor: border, backgroundColor: `${bg}40` }}>
      {/* Score ring */}
      <div className="relative w-36 h-36 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#1e2d45" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
            filter={`drop-shadow(0 0 6px ${color}88)`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold font-mono leading-none" style={{ color }}>{finalScore}</span>
          <span className="text-xs text-gray-500 font-mono">/100</span>
        </div>
      </div>

      {/* Level badge */}
      <div className="px-3 py-1 rounded-full text-sm font-bold border mb-3 font-mono uppercase tracking-widest" style={{ color, borderColor: border, backgroundColor: bg }}>
        {level} Risk
      </div>

      {/* Verified badge */}
      {verified ? (
        <div className="flex items-center gap-1.5 bg-[#00ff9d11] border border-[#00ff9d33] text-[#00ff9d] text-xs font-bold px-3 py-1.5 rounded-full mb-3">
          <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED REPORT
        </div>
      ) : (
        <div className="flex items-center gap-1.5 bg-[#ffd16611] border border-[#ffd16633] text-[#ffd166] text-xs px-3 py-1.5 rounded-full mb-3">
          <ShieldAlert className="w-3.5 h-3.5" /> LIMITED REPORT
        </div>
      )}

      {/* Confidence + breakdown */}
      <div className="w-full space-y-2 mt-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Confidence</span>
          <span className={`font-mono font-bold ${confidence === 'high' ? 'text-[#00ff9d]' : confidence === 'medium' ? 'text-[#ffd166]' : 'text-gray-400'}`}>
            {confidence.toUpperCase()}
          </span>
        </div>
        {Object.entries(scoreBundle.dimensions).map(([key, val]) => {
          const v = val as number
          const labels: Record<string, string> = { takeover: 'Account Takeover', theft: 'Identity Theft', phishing: 'Phishing Risk', exposure: 'Public Exposure' }
          const explainer: Record<string, string> = {
            takeover: 'Risk of account login compromise.',
            theft: 'Risk of personal identity misuse.',
            phishing: 'Risk of targeted social-engineering scams.',
            exposure: 'Risk from publicly discoverable personal data.',
          }
          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">{labels[key]}</span>
                <span className="font-mono text-gray-300">{v}</span>
              </div>
              <div className="text-[11px] text-gray-600 mb-1.5 leading-snug">{explainer[key]}</div>
              <div className="h-1 bg-[#1e2d45] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${v}%`, backgroundColor: v > 65 ? '#ff3b5c' : v > 35 ? '#ffd166' : '#00ff9d' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
