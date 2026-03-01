'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, Eye, FileDown, Info } from 'lucide-react'
import RadarChart from '@/components/dashboard/RadarChart'
import TimelineChart from '@/components/dashboard/TimelineChart'
import AttackGraph from '@/components/dashboard/AttackGraph'
import TimeSeriesAnalysisChart from '@/components/dashboard/TimeSeriesAnalysisChart'

export default function ReportPage() {
  const router = useRouter()
  const [result, setResult] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [showScoreGuide, setShowScoreGuide] = useState(false)
  const [openMetricHelp, setOpenMetricHelp] = useState<string | null>(null)

  useEffect(() => {
    const r = sessionStorage.getItem('ghostscan_result')
    const e = sessionStorage.getItem('ghostscan_email')
    if (!r) {
      router.push('/')
      return
    }
    try {
      setResult(JSON.parse(r))
      setEmail(e || '')
    } catch {
      sessionStorage.removeItem('ghostscan_result')
      router.push('/')
    }
  }, [router])

  const scoreGuide = useMemo(() => ([
    {
      title: 'Final Risk Score',
      formula: '0.35*Takeover + 0.25*Identity Theft + 0.20*Phishing + 0.20*Exposure',
      explain: 'Weighted blend of the four risk dimensions. Takeover has the highest impact.',
    },
    {
      title: 'Account Takeover',
      formula: 'password + hash + breach volume + recency + reuse + no 2FA - password manager',
      explain: 'Measures chance of account hijacking from leaked credentials and weak login habits.',
    },
    {
      title: 'Identity Theft',
      formula: 'name + phone + address + DOB signals',
      explain: 'Measures exposure of real-world identity attributes used for impersonation/fraud.',
    },
    {
      title: 'Phishing Risk',
      formula: 'name + public profile + recent breach + breach volume + disposable-domain signal',
      explain: 'Estimates how targetable the identity looks for social engineering campaigns.',
    },
    {
      title: 'Exposure Surface',
      formula: 'public profile + predictable email + disposable-domain + breach presence',
      explain: 'Estimates how easy it is to discover or correlate your data across sources.',
    },
  ]), [])

  if (!result) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="text-[var(--accent)] font-mono text-sm animate-pulse">Loading summary report...</div>
      </div>
    )
  }

  const { scoreBundle, breaches, velocity, trend, analytics, timeSeries, graphData } = result

  return (
    <div className="min-h-screen grid-bg">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] dark:border-white/[0.06] glass-nav print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[var(--accent)] rounded-md flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold">Ghost<span className="text-[var(--accent)]">Scan</span></span>
            <span className="hidden md:block text-[var(--text-muted)] text-sm font-mono">| Summary Report</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="gs-btn-ghost text-sm py-1.5 px-3 flex items-center gap-1.5">
              <FileDown className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button onClick={() => router.push('/dashboard')} className="gs-btn-ghost text-sm py-1.5 px-3 flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="gs-card p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold">Exposure Summary Report</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1 font-mono">{email || 'Unknown email'}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/[0.07] text-[var(--accent)] font-mono">
              Legal documents excluded
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Metric label="Final Score" value={String(scoreBundle?.finalScore ?? 0)} />
          <Metric label="Risk Level" value={String(scoreBundle?.level ?? 'unknown').toUpperCase()} />
          <Metric label="Breaches Found" value={String(breaches?.length ?? 0)} />
          <Metric label="Breach/Year" value={Number.parseFloat(velocity || '0').toFixed(2)} />
          <Metric label="Trend" value={String(trend || 'stable').toUpperCase()} />
        </div>

        <div className="gs-card p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold">Score Breakdown Help</div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">See what each score means and how it is calculated.</p>
            </div>
            <button
              onClick={() => setShowScoreGuide((v) => !v)}
              className="gs-btn-ghost text-sm py-2 px-3 flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              {showScoreGuide ? 'Hide Score Explanations' : 'Explain Scores'}
            </button>
          </div>
          {showScoreGuide && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
              {scoreGuide.map((item) => (
                <div key={item.title} className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded p-3">
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="text-xs text-blue-500 font-mono mt-1">{item.formula}</div>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">{item.explain}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="gs-card p-5">
            <div className="text-sm font-semibold text-[var(--text-muted)] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" /> Key Graph: Risk Dimensions
            </div>
            <RadarChart dimensions={scoreBundle?.dimensions} />
          </div>

          <div className="gs-card p-5">
            <div className="text-sm font-semibold text-[var(--text-muted)] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--accent)]" /> Key Graph: Breach Timeline
            </div>
            <TimelineChart breaches={breaches || []} />
          </div>
        </div>

        <div className="gs-card p-5">
          <div className="text-sm font-semibold text-[var(--text-muted)] mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#f8a5ff]" /> Extra Graph: Time-Series Analysis
          </div>
          <TimeSeriesAnalysisChart breaches={breaches || []} forecastNext12Months={timeSeries?.forecastNext12Months ?? 0} />
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Shows yearly breach count, cumulative trajectory, and next-12-month forecast.
          </p>
        </div>

        <div className="gs-card p-5">
          <div className="text-sm font-semibold text-[var(--text-muted)] mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#fbbf24]" /> Key Graph: Attack Surface Map
          </div>
          <div className="min-h-[360px]">
            <AttackGraph graphData={graphData} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="gs-card p-5">
            <div className="text-sm font-semibold text-[var(--text-muted)] mb-3">Time-Series Outputs</div>
            <ul className="text-sm text-[var(--text-muted)] space-y-2.5">
              <li>
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Average breach interval: <span className="font-mono">{timeSeries?.averageIntervalMonths ? `${timeSeries.averageIntervalMonths.toFixed(1)} months` : 'N/A'}</span></span>
                  <button
                    onClick={() => setOpenMetricHelp((v) => v === 'interval' ? null : 'interval')}
                    className="text-[11px] px-2 py-0.5 rounded border border-[#60a5fa44] text-blue-500 bg-[#60a5fa11] hover:bg-[#60a5fa22]"
                  >
                    Why?
                  </button>
                </div>
                {openMetricHelp === 'interval' && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Equation: <span className="font-mono">avg_interval_months = mean(gap between consecutive breach dates)</span>. Higher means breaches are spaced farther apart.
                  </p>
                )}
              </li>
              <li>
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Expected next breach window: <span className="font-mono">{analytics?.expectedWindow ? `${analytics.expectedWindow.min}-${analytics.expectedWindow.max} months` : 'N/A'}</span></span>
                  <button
                    onClick={() => setOpenMetricHelp((v) => v === 'window' ? null : 'window')}
                    className="text-[11px] px-2 py-0.5 rounded border border-[#60a5fa44] text-blue-500 bg-[#60a5fa11] hover:bg-[#60a5fa22]"
                  >
                    Why?
                  </button>
                </div>
                {openMetricHelp === 'window' && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Equation: <span className="font-mono">center = avg_interval * trend_multiplier</span>, then <span className="font-mono">min=0.75*center</span>, <span className="font-mono">max=1.25*center</span>.
                  </p>
                )}
              </li>
              <li>
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Momentum score: <span className="font-mono">{analytics?.momentumScore ?? 0}/100</span></span>
                  <button
                    onClick={() => setOpenMetricHelp((v) => v === 'momentum' ? null : 'momentum')}
                    className="text-[11px] px-2 py-0.5 rounded border border-[#60a5fa44] text-blue-500 bg-[#60a5fa11] hover:bg-[#60a5fa22]"
                  >
                    Why?
                  </button>
                </div>
                {openMetricHelp === 'momentum' && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Equation: <span className="font-mono">momentum = clamp(round(min(velocity*18,70) + trendBonus + recencyBonus), 0..100)</span>, where
                    <span className="font-mono"> trendBonus = +20 (increasing), 0 (stable), -10 (declining)</span> and
                    <span className="font-mono"> recencyBonus = +12 (&le;18 months), +6 (&le;36 months), else 0</span>.
                    Velocity means breaches per year (<span className="font-mono">breachCount / activeYears</span>). So momentum increases when breaches happen more often, trend is increasing, and the most recent breach is recent.
                  </p>
                )}
              </li>
              <li>12-month forecast: <span className="font-mono">{timeSeries?.forecastNext12Months ?? 0}</span></li>
              <li>Trend explanation: <span className="text-[var(--text-muted)]">{analytics?.trendExplanation || 'N/A'}</span></li>
            </ul>
          </div>

          <div className="gs-card p-5">
            <div className="text-sm font-semibold text-[var(--text-muted)] mb-3">Detailed Risk Notes</div>
            <ul className="text-sm text-[var(--text-muted)] space-y-2">
              <li>Account Takeover: <span className="font-mono">{scoreBundle?.dimensions?.takeover ?? 0}</span></li>
              <li>Identity Theft: <span className="font-mono">{scoreBundle?.dimensions?.theft ?? 0}</span></li>
              <li>Phishing Exposure: <span className="font-mono">{scoreBundle?.dimensions?.phishing ?? 0}</span></li>
              <li>Data Exposure: <span className="font-mono">{scoreBundle?.dimensions?.exposure ?? 0}</span></li>
              <li>Cluster Flag: <span className="font-mono">{analytics?.clusteredExposure ? 'Clustered' : 'Not clustered'}</span></li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="gs-card p-4">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-lg font-bold font-mono">{value}</div>
    </div>
  )
}
