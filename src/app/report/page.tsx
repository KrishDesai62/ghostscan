'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, Eye, FileDown, Info } from 'lucide-react'
import ReportRadarChart from '@/components/report/ReportRadarChart'
import ReportTimelineChart from '@/components/report/ReportTimelineChart'
import ReportAttackGraph from '@/components/report/ReportAttackGraph'
import TimeSeriesAnalysisChart from '@/components/dashboard/TimeSeriesAnalysisChart'
import GeminiChatWidget from '@/components/ui/GeminiChatWidget'

/*
  Revert notes (original values before this styling pass):
  - page wrapper: min-h-screen grid-bg
  - header border/bg: border-[#1e2d45] bg-[#080b12]/90
  - logo chip: bg-[#00ff9d], accent text #00ff9d
  - card primitives: gs-card with uniform radius/shadow
  - metric card text: label text-gray-500, value text-white
  - chart imports: dashboard RadarChart / TimelineChart / AttackGraph (neon palette)
*/

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
  const printDimensions = [
    { key: 'Takeover', value: scoreBundle?.dimensions?.takeover ?? 0, color: '#dc2626' },
    { key: 'Theft', value: scoreBundle?.dimensions?.theft ?? 0, color: '#ea580c' },
    { key: 'Phishing', value: scoreBundle?.dimensions?.phishing ?? 0, color: '#ca8a04' },
    { key: 'Exposure', value: scoreBundle?.dimensions?.exposure ?? 0, color: '#6b7280' },
  ]
  const yearlyMap: Record<string, number> = {}
  ;(breaches || []).forEach((b: any) => {
    if (!b?.breach_date) return
    const y = String(new Date(b.breach_date).getFullYear())
    if (!y || y === 'NaN') return
    yearlyMap[y] = (yearlyMap[y] || 0) + 1
  })
  const printYearly = Object.entries(yearlyMap)
    .sort(([a], [b]) => Number(a) - Number(b))
    .slice(-6)
    .map(([year, count]) => ({ year, count }))
  const maxYearly = Math.max(1, ...printYearly.map((d) => d.count))

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
            <button
              onClick={() => window.print()}
              className="text-sm py-1.5 px-3 flex items-center gap-1.5 rounded-md border border-[#c7c1b6] text-[#334155] hover:bg-[#eee7da] transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm py-1.5 px-3 flex items-center gap-1.5 rounded-md border border-[#c7c1b6] text-[#334155] hover:bg-[#eee7da] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>
        </div>
      </header>

      {/* original main spacing: py-6 space-y-4 */}
      <main className="max-w-7xl mx-auto px-4 py-7 space-y-5">
        <div className="hidden print:block print-report border border-gray-200 bg-[#faf9f7] p-6 text-[#1a1a1a]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-[#1a1a1a]">GhostScan Summary Report</h1>
              <p className="text-xs text-[#6b7280] font-mono mt-0.5">{email || 'Unknown email'}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#dc2626] flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-5">
            <PrintMetric label="Score" value={String(scoreBundle?.finalScore ?? 0)} />
            <PrintMetric label="Level" value={String(scoreBundle?.level ?? 'unknown').toUpperCase()} />
            <PrintMetric label="Breaches" value={String(breaches?.length ?? 0)} />
            <PrintMetric label="Velocity" value={Number.parseFloat(velocity || '0').toFixed(2)} />
            <PrintMetric label="Trend" value={String(trend || 'stable').toUpperCase()} />
          </div>

          <div className="grid grid-cols-2 gap-6 mb-5 text-xs leading-relaxed">
            <div className="bg-white/80 border border-gray-200 rounded-xl p-4">
              <div className="font-semibold mb-2 text-[#1a1a1a]">Risk Dimensions</div>
              <ul className="space-y-1 text-[#374151]">
                <li>Takeover: <span className="font-mono font-semibold">{scoreBundle?.dimensions?.takeover ?? 0}</span></li>
                <li>Identity Theft: <span className="font-mono font-semibold">{scoreBundle?.dimensions?.theft ?? 0}</span></li>
                <li>Phishing: <span className="font-mono font-semibold">{scoreBundle?.dimensions?.phishing ?? 0}</span></li>
                <li>Exposure: <span className="font-mono font-semibold">{scoreBundle?.dimensions?.exposure ?? 0}</span></li>
              </ul>
            </div>
            <div className="bg-white/80 border border-gray-200 rounded-xl p-4">
              <div className="font-semibold mb-2 text-[#1a1a1a]">Time-Series</div>
              <ul className="space-y-1 text-[#374151]">
                <li>Avg interval: <span className="font-mono font-semibold">{timeSeries?.averageIntervalMonths ? `${timeSeries.averageIntervalMonths.toFixed(1)} mo` : 'N/A'}</span></li>
                <li>Next window: <span className="font-mono font-semibold">{analytics?.expectedWindow ? `${analytics.expectedWindow.min}-${analytics.expectedWindow.max} mo` : 'N/A'}</span></li>
                <li>Momentum: <span className="font-mono font-semibold">{analytics?.momentumScore ?? 0}/100</span></li>
                <li>Forecast 12M: <span className="font-mono font-semibold">{timeSeries?.forecastNext12Months ?? 0}</span></li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-5">
            <div className="bg-white/80 border border-gray-200 rounded-xl p-4">
              <div className="font-semibold text-xs mb-2 text-[#1a1a1a]">Mini Graph: Risk Profile</div>
              <div className="space-y-1.5">
                {printDimensions.map((d) => (
                  <div key={d.key} className="flex items-center gap-2">
                    <span className="w-14 text-[#6b7280] text-xs">{d.key}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 border border-gray-200 rounded overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${Math.max(2, Math.min(100, d.value))}%`, backgroundColor: d.color }} />
                    </div>
                    <span className="w-6 text-right font-mono font-semibold text-[#1a1a1a] text-xs">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/80 border border-gray-200 rounded-xl p-4">
              <div className="font-semibold text-xs mb-2 text-[#1a1a1a]">Mini Graph: Yearly Breach Trend</div>
              <div className="h-12 border border-gray-200 bg-gray-50 rounded px-2 py-2 flex items-end gap-1">
                {printYearly.length === 0 ? (
                  <div className="text-xs text-[#6b7280]">No timeline data</div>
                ) : (
                  printYearly.map((d) => (
                    <div key={d.year} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                      <div
                        className="w-full bg-[#dc2626] rounded-t"
                        style={{ height: `${Math.max(4, Math.round((d.count / maxYearly) * 36))}px` }}
                      />
                      <span className="text-[10px] text-[#6b7280] leading-none">{d.year.slice(-2)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-1.5 text-xs text-[#6b7280]">
                Forecast 12M: <span className="font-mono font-semibold text-[#1a1a1a]">{timeSeries?.forecastNext12Months ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white/90 border border-gray-200 rounded-xl p-5">
            <div className="font-semibold text-sm text-[#1a1a1a] mb-3">Model Summary (Core Equations)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-l-2 border-[#dc2626] pl-4 py-1">
                <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-0.5">Final Score</div>
                <div className="text-xs font-mono text-[#1a1a1a] leading-relaxed">
                  0.35 × Takeover + 0.25 × Theft + 0.20 × Phishing + 0.20 × Exposure
                </div>
              </div>
              <div className="border-l-2 border-[#dc2626] pl-4 py-1">
                <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-0.5">Velocity</div>
                <div className="text-xs font-mono text-[#1a1a1a] leading-relaxed">
                  breachCount ÷ activeYears
                </div>
              </div>
              <div className="border-l-2 border-[#dc2626] pl-4 py-1 sm:col-span-2">
                <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-0.5">Momentum</div>
                <div className="text-xs font-mono text-[#1a1a1a] leading-relaxed">
                  clamp(round(min(velocity×18, 70) + trendBonus + recencyBonus), 0..100)
                </div>
              </div>
              <div className="border-l-2 border-[#dc2626] pl-4 py-1 sm:col-span-2">
                <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-0.5">Next Breach Window</div>
                <div className="text-xs font-mono text-[#1a1a1a] leading-relaxed">
                  center = avgInterval × trendMultiplier; range = 0.75× .. 1.25×
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 text-[10px] text-[#6b7280] leading-relaxed">
              <span className="font-medium text-[#1a1a1a]">Parameters:</span> trendBonus = +20 (increasing), 0 (stable), −10 (declining) · recencyBonus = +12 (≤18m), +6 (≤36m), else 0
            </div>
          </div>
        </div>

        <div className="print:hidden space-y-5">
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
              className="text-[0.82rem] py-1.5 px-3 flex items-center gap-1.5 rounded-sm border border-[#c7c1b6] text-[#334155] hover:bg-[#eee7da] transition-colors tracking-[0.01em]"
            >
              <Info className="w-3.5 h-3.5" />
              {showScoreGuide ? 'Hide Score Explanations' : 'Explain Scores'}
            </button>
          </div>
          {/* original explanation grid: gap-2 mt-3 */}
          {showScoreGuide && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2.5">
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
            <ReportRadarChart dimensions={scoreBundle?.dimensions} />
          </div>

          <div className="gs-card p-5">
            <div className="text-sm font-semibold text-[var(--text-muted)] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--accent)]" /> Key Graph: Breach Timeline
            </div>
            <ReportTimelineChart breaches={breaches || []} />
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
            <ReportAttackGraph graphData={graphData} />
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
        </div>
      </main>
      <div className="print:hidden">
        <GeminiChatWidget />
      </div>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: #faf9f7 !important;
          }
          .print-report {
            min-height: 277mm;
            width: 100%;
          }
        }
      `}</style>
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

function PrintMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 bg-white/80 rounded-lg px-3 py-2">
      <div className="text-[10px] text-[#6b7280] uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold font-mono text-[#1a1a1a] mt-0.5">{value}</div>
    </div>
  )
}
