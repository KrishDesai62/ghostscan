'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, Eye, FileDown, Info } from 'lucide-react'
import ReportRadarChart from '@/components/report/ReportRadarChart'
import ReportTimelineChart from '@/components/report/ReportTimelineChart'
import ReportAttackGraph from '@/components/report/ReportAttackGraph'
import TimeSeriesAnalysisChart from '@/components/dashboard/TimeSeriesAnalysisChart'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f7f2e8] to-[#edf3f8]">
        <div className="text-[#1f2937] font-mono text-sm animate-pulse">Loading summary report...</div>
      </div>
    )
  }

  const { scoreBundle, breaches, velocity, trend, analytics, timeSeries, graphData } = result

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f2e8] to-[#edf3f8] text-[#1f2937]">
      <header className="sticky top-0 z-40 border-b border-[#d7d2c8] bg-[#f8f4ec]/95 backdrop-blur-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#1e3a5f] rounded-md flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold">Ghost<span className="text-[#1e3a5f]">Scan</span></span>
            <span className="hidden md:block text-[#6b7280] text-sm font-mono">| Summary Report</span>
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
        <div className="rounded-xl border border-[#d7d2c8] bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              {/* original title: text-xl font-bold */}
              <h1 className="text-[1.35rem] tracking-[-0.01em] leading-[1.15] font-semibold text-[#111827]">Exposure Summary Report</h1>
              {/* original subtext classes: text-sm text-[#6b7280] mt-1 font-mono */}
              <p className="text-[0.8rem] tracking-[0.01em] leading-[1.45] text-[#6b7280] mt-1.5 font-mono">{email || 'Unknown email'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Metric label="Final Score" value={String(scoreBundle?.finalScore ?? 0)} />
          <Metric label="Risk Level" value={String(scoreBundle?.level ?? 'unknown').toUpperCase()} />
          <Metric label="Breaches Found" value={String(breaches?.length ?? 0)} />
          <Metric label="Breach/Year" value={Number.parseFloat(velocity || '0').toFixed(2)} />
          <Metric label="Trend" value={String(trend || 'stable').toUpperCase()} />
        </div>

        {/* original section padding/gap: p-4, gap-3 */}
        <div className="rounded-xl border border-[#d7d2c8] bg-white/80 p-4 shadow-[0_10px_24px_rgba(53,92,125,0.07)]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
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
                <div key={item.title} className="bg-[#fbfaf7] border border-[#e1dbcf] rounded-sm px-3 py-2.5">
                  <div className="text-[0.86rem] leading-[1.2] font-semibold text-[#111827]">{item.title}</div>
                  <div className="text-[0.72rem] tracking-[0.01em] text-[#1e3a5f] font-mono mt-1">{item.formula}</div>
                  <p className="text-[0.74rem] leading-[1.45] text-[#6b7280] mt-1.5">{item.explain}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* original top graph grid gap: gap-4 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-[#d7d2c8] bg-white/85 p-5 shadow-[0_9px_22px_rgba(123,79,44,0.08)]">
            <div className="text-[0.86rem] tracking-[0.01em] font-semibold text-[#374151] mb-2.5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1e3a5f]" /> Risk Dimensions
            </div>
            <ReportRadarChart dimensions={scoreBundle?.dimensions} />
          </div>

          <div className="rounded-xl border border-[#d7d2c8] bg-white/85 p-5 shadow-[0_9px_22px_rgba(53,92,125,0.07)]">
            <div className="text-[0.86rem] tracking-[0.01em] font-semibold text-[#374151] mb-2.5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#7b4f2c]" /> Breach Timeline
            </div>
            <ReportTimelineChart breaches={breaches || []} />
          </div>
        </div>

        <div className="rounded-xl border border-[#d7d2c8] bg-white/85 p-5 shadow-[0_9px_22px_rgba(108,138,100,0.08)]">
          <div className="text-[0.86rem] tracking-[0.01em] font-semibold text-[#374151] mb-2.5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#355c7d]" /> Time-Series Analysis
          </div>
          <TimeSeriesAnalysisChart breaches={breaches || []} forecastNext12Months={timeSeries?.forecastNext12Months ?? 0} />
        </div>

        <div className="rounded-xl border border-[#d7d2c8] bg-[#0f172a] p-5 shadow-sm">
          <div className="text-sm font-semibold text-[#d1d5db] mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#eab308]" /> Attack Surface Map
          </div>
          <div className="min-h-[360px]">
            <ReportAttackGraph graphData={graphData} />
          </div>
        </div>

        {/* original lower grid gap: gap-4 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-[#d7d2c8] bg-white/85 p-5 shadow-[0_9px_22px_rgba(123,79,44,0.06)]">
            <div className="text-[0.86rem] tracking-[0.01em] font-semibold text-[#374151] mb-2.5">Time-Series Outputs</div>
            <ul className="text-[0.86rem] leading-[1.45] text-[#374151] space-y-2.5">
              <li>
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Average breach interval: <span className="font-mono">{timeSeries?.averageIntervalMonths ? `${timeSeries.averageIntervalMonths.toFixed(1)} months` : 'N/A'}</span></span>
                  <button
                    onClick={() => setOpenMetricHelp((v) => v === 'interval' ? null : 'interval')}
                    className="text-[11px] px-2 py-0.5 rounded-sm border border-[#c7c1b6] text-[#334155] bg-[#f7f2e8] hover:bg-[#eee7da]"
                  >
                    Why?
                  </button>
                </div>
                {openMetricHelp === 'interval' && (
                  <p className="text-xs text-[#6b7280] mt-1">
                    Equation: <span className="font-mono">avg_interval_months = mean(gap between consecutive breach dates)</span>. Higher means breaches are spaced farther apart.
                  </p>
                )}
              </li>
              <li>
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Expected next breach window: <span className="font-mono">{analytics?.expectedWindow ? `${analytics.expectedWindow.min}-${analytics.expectedWindow.max} months` : 'N/A'}</span></span>
                  <button
                    onClick={() => setOpenMetricHelp((v) => v === 'window' ? null : 'window')}
                    className="text-[11px] px-2 py-0.5 rounded border border-[#c7c1b6] text-[#334155] bg-[#f7f2e8] hover:bg-[#eee7da]"
                  >
                    Why?
                  </button>
                </div>
                {openMetricHelp === 'window' && (
                  <p className="text-xs text-[#6b7280] mt-1">
                    Equation: <span className="font-mono">center = avg_interval * trend_multiplier</span>, then <span className="font-mono">min=0.75*center</span>, <span className="font-mono">max=1.25*center</span>.
                  </p>
                )}
              </li>
              <li>
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Momentum score: <span className="font-mono">{analytics?.momentumScore ?? 0}/100</span></span>
                  <button
                    onClick={() => setOpenMetricHelp((v) => v === 'momentum' ? null : 'momentum')}
                    className="text-[11px] px-2 py-0.5 rounded border border-[#c7c1b6] text-[#334155] bg-[#f7f2e8] hover:bg-[#eee7da]"
                  >
                    Why?
                  </button>
                </div>
                {openMetricHelp === 'momentum' && (
                  <p className="text-xs text-[#6b7280] mt-1">
                    Equation: <span className="font-mono">momentum = clamp(round(min(velocity*18,70) + trendBonus + recencyBonus), 0..100)</span>, where
                    <span className="font-mono"> trendBonus = +20 (increasing), 0 (stable), -10 (declining)</span> and
                    <span className="font-mono"> recencyBonus = +12 (&le;18 months), +6 (&le;36 months), else 0</span>.
                    Velocity means breaches per year (<span className="font-mono">breachCount / activeYears</span>). So momentum increases when breaches happen more often, trend is increasing, and the most recent breach is recent.
                  </p>
                )}
              </li>
              <li>12-month forecast: <span className="font-mono">{timeSeries?.forecastNext12Months ?? 0}</span></li>
              <li>Trend explanation: <span className="text-[#6b7280]">{analytics?.trendExplanation || 'N/A'}</span></li>
            </ul>
          </div>

          <div className="rounded-xl border border-[#d7d2c8] bg-white/85 p-5 shadow-[0_9px_22px_rgba(53,92,125,0.06)]">
            <div className="text-[0.86rem] tracking-[0.01em] font-semibold text-[#374151] mb-2.5">Detailed Risk Notes</div>
            <ul className="text-[0.86rem] leading-[1.45] text-[#374151] space-y-2">
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
    // original metric card classes: rounded-xl border border-[#d7d2c8] bg-white/85 p-4 shadow-sm
    <div className="rounded-xl border border-[#d7d2c8] bg-white/85 p-4 shadow-sm">
      <div className="text-xs text-[#6b7280]">{label}</div>
      <div className="mt-1 text-lg font-bold font-mono text-[#111827]">{value}</div>
    </div>
  )
}
