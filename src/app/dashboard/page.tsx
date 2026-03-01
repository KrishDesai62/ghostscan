'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle, TrendingUp, Eye, Zap, Mail, Trash2, Clock, ChevronRight, ShieldCheck, Info, KeyRound, FileText } from 'lucide-react'
import RiskOverview from '@/components/dashboard/RiskOverview'
import MitigationSimulator from '@/components/dashboard/MitigationSimulator'
import DeletionCenter from '@/components/deletion/DeletionCenter'
import { getPrivacyLawProfile, type ResidencyState } from '@/lib/us-privacy-laws'

export default function DashboardPage() {
  const router = useRouter()
  const [result, setResult] = useState<any>(null)
  const [checkedSession, setCheckedSession] = useState(false)
  const [email, setEmail] = useState('')
  const [verified, setVerified] = useState(false)
  const [showDeletion, setShowDeletion] = useState(false)
  const [userState, setUserState] = useState('US_OTHER')

  useEffect(() => {
    const r = sessionStorage.getItem('ghostscan_result')
    const e = sessionStorage.getItem('ghostscan_email')
    const v = sessionStorage.getItem('ghostscan_verified')
    const state = sessionStorage.getItem('ghostscan_state')
    if (!r) {
      setCheckedSession(true)
      router.push('/')
      return
    }
    try {
      setResult(JSON.parse(r))
    } catch {
      sessionStorage.removeItem('ghostscan_result')
      setCheckedSession(true)
      router.push('/')
      return
    }
    setEmail(e || '')
    setVerified(v === '1')
    setUserState(state || 'US_OTHER')
    setCheckedSession(true)
  }, [router])

  if (!result) return (
    <div className="min-h-screen grid-bg flex items-center justify-center">
      <div className="text-[#00ff9d] font-mono text-sm animate-pulse">
        {checkedSession ? 'Redirecting...' : 'Loading report...'}
      </div>
    </div>
  )

  const { scoreBundle, breaches, velocity, trend, dataSource, timeSeries, analytics } = result
  const level = scoreBundle.level
  const velocityNum = Number.parseFloat(velocity || '0') || 0
  const fallbackMomentum = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        velocityNum * 18 +
        (trend === 'increasing' ? 20 : trend === 'declining' ? -10 : 0)
      )
    )
  )
  const momentumScore = analytics?.momentumScore ?? fallbackMomentum
  const expectedWindowText = analytics?.expectedWindow
    ? `${analytics.expectedWindow.min}-${analytics.expectedWindow.max} months`
    : 'Insufficient history'
  const lawProfile = getPrivacyLawProfile(userState as ResidencyState)

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e2d45] bg-[#080b12]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#00ff9d] rounded-md flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-[#080b12]" />
            </div>
            <span className="font-bold">Ghost<span className="text-[#00ff9d]">Scan</span></span>
            <span className="hidden md:block text-gray-600 text-sm font-mono">|</span>
              <span className="hidden md:block text-gray-500 text-xs font-mono truncate max-w-48">{email}</span>
              <span className="hidden lg:block text-gray-600 text-xs font-mono">· {userState}</span>
            </div>
          <div className="flex items-center gap-2">
            {verified ? (
              <span className="flex items-center gap-1.5 bg-[#00ff9d11] border border-[#00ff9d33] text-[#00ff9d] text-xs font-bold px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3 h-3" /> VERIFIED
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-[#ffd16611] border border-[#ffd16633] text-[#ffd166] text-xs px-2.5 py-1 rounded-full">
                <Info className="w-3 h-3" /> LIMITED REPORT
              </span>
            )}
            <button
              onClick={() => router.push('/checker')}
              className="gs-btn-ghost text-sm py-2 px-3"
            >
              Scam Checker
            </button>
            <button
              onClick={() => router.push('/password-checker')}
              className="gs-btn-ghost text-sm py-2 px-3 flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" /> Password Checker
            </button>
            <button
              onClick={() => router.push('/report')}
              className="gs-btn-ghost text-sm py-2 px-3 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Summary Report
            </button>
            <button
              onClick={() => setShowDeletion(true)}
              className="gs-btn-primary text-sm py-2 px-4 flex items-center gap-2"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Data Removal Center</span>
              <span className="md:hidden">Remove Data</span>
            </button>
          </div>
        </div>
      </header>

      {/* Limited report banner */}
      {!verified && (
        <div className="bg-[#ffd16611] border-b border-[#ffd16633] px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
            <AlertTriangle className="w-4 h-4 text-[#ffd166] flex-shrink-0" />
            <span className="text-[#ffd166]">Limited Report — </span>
            <span className="text-gray-400">Complete liveness verification to unlock the full Verified dashboard and higher confidence scoring.</span>
            <button onClick={() => router.push('/verify')} className="ml-auto text-[#ffd166] font-semibold text-xs border border-[#ffd16633] px-3 py-1 rounded-full hover:bg-[#ffd16611] transition-colors whitespace-nowrap">
              Verify Now →
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className={`gs-card px-4 py-2.5 text-xs font-mono ${
          dataSource?.startsWith('live') ? 'border-[#00ff9d33] text-[#00ff9d]' : 'border-[#ffd16633] text-[#ffd166]'
        }`}>
          {dataSource?.startsWith('live')
            ? 'Live breach intelligence source: HIBP'
            : 'Mock breach dataset in use. Add HIBP_API_KEY in .env.local for real breach data.'}
        </div>
        {/* Top row: Risk Overview + Breach Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RiskOverview scoreBundle={scoreBundle} verified={verified} breachCount={breaches.length} />

          {/* Quick stats */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: AlertTriangle, label: 'Breaches Found', value: breaches.length, color: level === 'high' ? '#ff3b5c' : level === 'moderate' ? '#ffd166' : '#00ff9d' },
              { icon: TrendingUp,    label: 'Exposure Trend', value: trend?.toUpperCase() || 'STABLE', color: trend === 'increasing' ? '#ff3b5c' : trend === 'declining' ? '#00ff9d' : '#ffd166' },
              { icon: Zap,           label: 'Breach/Year',   value: velocityNum.toFixed(1), color: '#4cc9f0' },
              { icon: Clock,         label: 'Forecast 12M', value: `${timeSeries?.forecastNext12Months ?? 0}`, color: '#6b7280' },
            ].map(item => (
              <div key={item.label} className="gs-card p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
                <div className="text-xl font-bold font-mono" style={{ color: item.color }}>{item.value}</div>
                {item.label === 'Exposure Trend' && (
                  <p className="text-[11px] text-gray-600 leading-snug mt-0.5">
                    {trend === 'declining' ? 'Fewer breaches in last 24 months vs previous 24 months.' :
                     trend === 'increasing' ? 'More breaches in last 24 months vs previous 24 months.' :
                     'Recent and prior 24-month periods are similar.'}
                  </p>
                )}
              </div>
            ))}

            {/* Breach list preview */}
            <div className="col-span-2 md:col-span-4 gs-card p-4 bg-gradient-to-r from-[#0e1421] to-[#131c2d]">
              <div className="text-xs text-gray-500 mb-3 font-mono uppercase tracking-wider">Breaches Detected</div>
              <div className="flex flex-wrap gap-2">
                {breaches.map((b: any) => (
                  <span key={b.breach_name} className="gs-badge-high">{b.breach_name}</span>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <span className="font-mono">Trend logic:</span> {analytics?.trendExplanation || 'Recent and prior periods are compared over 24-month windows.'}
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="text-xs bg-[#080b12] border border-[#1e2d45] rounded-md px-2.5 py-2">
                  <span className="text-gray-500">Avg breach interval</span>
                  <div className="font-mono text-gray-300 mt-0.5">{timeSeries?.averageIntervalMonths ? `${timeSeries.averageIntervalMonths.toFixed(1)} months` : 'N/A'}</div>
                  <p className="text-[11px] text-gray-600 mt-1">Average time between breach dates.</p>
                </div>
                <div className="text-xs bg-[#080b12] border border-[#1e2d45] rounded-md px-2.5 py-2">
                  <span className="text-gray-500">Momentum score</span>
                  <div className="font-mono text-[#4cc9f0] mt-0.5">{momentumScore}/100</div>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Blends breach velocity, trend direction, and recency. {momentumScore === 0 ? 'Zero means very low recent breach activity.' : ''}
                  </p>
                </div>
                <div className="text-xs bg-[#080b12] border border-[#1e2d45] rounded-md px-2.5 py-2">
                  <span className="text-gray-500">Expected next breach window</span>
                  <div className="font-mono text-gray-300 mt-0.5">{expectedWindowText}</div>
                  <p className="text-[11px] text-gray-600 mt-1">Estimated range from interval + trend adjustment.</p>
                </div>
              </div>
              <div className="mt-2 text-xs">
                <span className="font-mono text-gray-500">Cluster flag:</span>{' '}
                <span className={analytics?.clusteredExposure ? 'text-[#ff3b5c]' : 'text-gray-400'}>
                  {analytics?.clusteredExposure ? 'Recent exposures appear clustered' : 'No strong clustering pattern'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mitigation Simulator */}
        <div className="grid grid-cols-1 gap-4">
          <div className="gs-card p-4">
            <div className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#4cc9f0]" /> Mitigation Simulator
            </div>
            <MitigationSimulator baseline={scoreBundle} hygiene={result.hygiene} />
          </div>
        </div>

        {/* Legal actions row */}
        <div className="gs-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#00ff9d]" /> Legal Actions & Data Removal
            </div>
            <button onClick={() => setShowDeletion(true)} className="gs-btn-primary text-sm py-2 px-4 flex items-center gap-2">
              Open Data Removal Center <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'GDPR Article 17', desc: 'Right to erasure — EU/UK residents', badge: 'GDPR', color: '#4cc9f0' },
              {
                label: lawProfile.recommendedRegime === 'us_state_delete' ? `${lawProfile.lawName}` : 'CCPA §1798.105',
                desc: lawProfile.recommendedRegime === 'us_state_delete' ? `${lawProfile.label} deletion right path` : 'California deletion right',
                badge: lawProfile.recommendedRegime === 'us_state_delete' ? 'STATE' : 'CCPA',
                color: '#ffd166'
              },
              { label: 'Breach Erasure', desc: 'Combined GDPR/CCPA for breach victims', badge: 'BREACH', color: '#ff3b5c' },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => setShowDeletion(true)}
                className="gs-card p-4 text-left hover:border-[#1e3a5f] transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border" style={{ color: item.color, borderColor: `${item.color}44`, backgroundColor: `${item.color}11` }}>{item.badge}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#00ff9d] transition-colors" />
                </div>
                <div className="font-semibold text-sm text-white">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between py-2 text-xs text-gray-600">
          <span className="font-mono">GhostScan · Demo Build · Data expires in 30 days</span>
          <div className="flex items-center gap-4">
            <button onClick={() => { sessionStorage.clear(); router.push('/') }} className="flex items-center gap-1.5 hover:text-[#ff3b5c] transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete All Data
            </button>
          </div>
        </div>
      </div>

      {/* Deletion Center */}
      <DeletionCenter
        open={showDeletion}
        onClose={() => setShowDeletion(false)}
        email={email}
        breaches={breaches}
        scanId={result.scanId}
        userState={userState}
      />
    </div>
  )
}
