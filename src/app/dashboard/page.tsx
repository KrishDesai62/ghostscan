'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, TrendingUp, Eye, Zap, Mail, Trash2, Clock, ChevronRight, ShieldCheck, Info, KeyRound, FileText, ArrowRight, WandSparkles } from 'lucide-react'
import RiskOverview from '@/components/dashboard/RiskOverview'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { AnimatedStagger, AnimatedStaggerItem } from '@/components/ui/AnimatedStagger'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import RadarChart from '@/components/dashboard/RadarChart'
import TimelineChart from '@/components/dashboard/TimelineChart'
import AttackGraph from '@/components/dashboard/AttackGraph'
import MitigationSimulator from '@/components/dashboard/MitigationSimulator'
import DeletionCenter from '@/components/deletion/DeletionCenter'
import GeminiChatWidget from '@/components/ui/GeminiChatWidget'
import { getPrivacyLawProfile, type ResidencyState } from '@/lib/us-privacy-laws'
import { DATA_BROKERS } from '@/lib/data-brokers'

export default function DashboardPage() {
  const router = useRouter()
  const [result, setResult] = useState<any>(null)
  const [checkedSession, setCheckedSession] = useState(false)
  const [email, setEmail] = useState('')
  const [verified, setVerified] = useState(false)
  const [showDeletion, setShowDeletion] = useState(false)
  const [userState, setUserState] = useState('US_OTHER')
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'simulate'>('overview')
  const simulatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const r = sessionStorage.getItem('ghostscan_result')
    const e = sessionStorage.getItem('ghostscan_email')
    const v = sessionStorage.getItem('ghostscan_verified')
    const state = sessionStorage.getItem('ghostscan_state')
    if (!r) { setCheckedSession(true); router.push('/'); return }
    try { setResult(JSON.parse(r)) } catch { sessionStorage.removeItem('ghostscan_result'); setCheckedSession(true); router.push('/'); return }
    setEmail(e || '')
    setVerified(v === '1')
    setUserState(state || 'US_OTHER')
    setCheckedSession(true)
  }, [router])

  if (!result) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-[var(--accent)] font-mono animate-pulse text-lg">
        {checkedSession ? 'Redirecting...' : 'Loading report...'}
      </div>
    </div>
  )

  const { scoreBundle, breaches, velocity, trend, dataSource, timeSeries, analytics } = result
  const level = scoreBundle.level
  const velocityNum = Number.parseFloat(velocity || '0') || 0
  const fallbackMomentum = Math.max(0, Math.min(100, Math.round(velocityNum * 18 + (trend === 'increasing' ? 20 : trend === 'declining' ? -10 : 0))))
  const momentumScore = analytics?.momentumScore ?? fallbackMomentum
  const expectedWindowText = analytics?.expectedWindow ? `${analytics.expectedWindow.min}-${analytics.expectedWindow.max} months` : 'Insufficient history'
  const lawProfile = getPrivacyLawProfile(userState as ResidencyState)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] dark:border-white/[0.06] glass-nav">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--accent)] rounded-xl flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg">Ghost<span className="text-[var(--accent)]">Scan</span></span>
            <span className="hidden md:block text-[var(--text-muted)] mx-2">|</span>
            <span className="hidden md:block text-[var(--text-muted)] text-sm truncate max-w-48">{email}</span>
          </div>
          <div className="flex items-center gap-2">
            {verified ? (
              <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-bold px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm px-3 py-1.5 rounded-full">
                <Info className="w-3.5 h-3.5" /> Limited
              </span>
            )}
            <button onClick={() => router.push('/checker')} className="gs-btn-ghost text-sm py-2 px-4">Scam Checker</button>
            <button onClick={() => router.push('/password-checker')} className="gs-btn-ghost text-sm py-2 px-4 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Password
            </button>
            <button onClick={() => router.push('/report')} className="gs-btn-ghost text-sm py-2 px-4 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Report
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {!verified && (
        <div className="bg-amber-50 dark:bg-amber-500/5 border-b border-amber-200 dark:border-amber-500/20 px-6 py-3">
          <div className="max-w-[1400px] mx-auto flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span className="text-amber-700 dark:text-amber-400 font-medium">Limited Report</span>
            <span className="text-[var(--text-muted)]">— Complete liveness verification for the full dashboard.</span>
            <button onClick={() => router.push('/verify')} className="ml-auto text-amber-600 dark:text-amber-400 font-semibold text-sm border border-amber-300 dark:border-amber-500/30 px-4 py-1.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors whitespace-nowrap">
              Verify Now
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        {/* Action cards */}
        <AnimatedStagger className="grid grid-cols-1 md:grid-cols-2 gap-4" staggerDelay={0.08}>
          <AnimatedStaggerItem>
            <button onClick={() => { setActiveTab('simulate'); setTimeout(() => simulatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100) }} className="w-full gs-card p-6 text-left hover:shadow-lg transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)]/20 transition-colors">
                  <WandSparkles className="w-7 h-7 text-[var(--accent)]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">What Should I Do?</h3>
                  <p className="text-[var(--text-muted)]">See which actions will reduce your risk score the most.</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
              </div>
            </button>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <button onClick={() => setShowDeletion(true)} className="w-full gs-card p-6 text-left hover:shadow-lg transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                  <Mail className="w-7 h-7 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">Remove My Data</h3>
                  <p className="text-[var(--text-muted)]">Send deletion requests to {DATA_BROKERS.length}+ data brokers and breach sources.</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-blue-500 transition-colors" />
              </div>
            </button>
          </AnimatedStaggerItem>
        </AnimatedStagger>

        {/* Score + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnimatedSection variant="fadeUp">
            <RiskOverview scoreBundle={scoreBundle} verified={verified} breachCount={breaches.length} />
          </AnimatedSection>

          <div className="lg:col-span-2 space-y-4">
            <AnimatedStagger className="grid grid-cols-2 md:grid-cols-4 gap-4" staggerDelay={0.06}>
              {[
                { icon: AlertTriangle, label: 'Breaches', value: breaches.length, color: level === 'high' ? 'text-red-500' : level === 'moderate' ? 'text-amber-500' : 'text-blue-500' },
                { icon: TrendingUp, label: 'Trend', value: trend?.toUpperCase() || 'STABLE', color: trend === 'increasing' ? 'text-red-500' : trend === 'declining' ? 'text-blue-500' : 'text-amber-500' },
                { icon: Zap, label: 'Per Year', value: velocityNum.toFixed(1), color: 'text-blue-500' },
                { icon: Clock, label: '12M Forecast', value: `${timeSeries?.forecastNext12Months ?? 0}`, color: 'text-[var(--text-muted)]' },
              ].map(item => (
                <AnimatedStaggerItem key={item.label}>
                  <div className="gs-card p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-sm text-[var(--text-muted)]">{item.label}</span>
                    </div>
                    <div className={`text-3xl font-extrabold font-mono ${item.color}`}>{item.value}</div>
                  </div>
                </AnimatedStaggerItem>
              ))}
            </AnimatedStagger>

            <AnimatedSection variant="fadeUp">
              <div className="gs-card p-5">
                <div className="text-sm text-[var(--text-muted)] mb-3 font-mono uppercase tracking-wider">Breaches Detected</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {breaches.map((b: any) => (
                    <span key={b.breach_name} className="gs-badge-high">{b.breach_name}</span>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Avg interval', value: timeSeries?.averageIntervalMonths ? `${timeSeries.averageIntervalMonths.toFixed(1)} mo` : 'N/A', color: '' },
                    { label: 'Momentum', value: `${momentumScore}/100`, color: 'text-blue-500' },
                    { label: 'Next breach window', value: expectedWindowText, color: '' },
                  ].map(s => (
                    <div key={s.label} className="glass rounded-xl px-4 py-3">
                      <span className="text-sm text-[var(--text-muted)]">{s.label}</span>
                      <div className={`font-mono text-lg mt-1 ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection variant="fadeUp">
              <div className="gs-card p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-[var(--text-muted)] mb-2 font-mono uppercase tracking-wider">Trend Analysis</div>
                    <p className="leading-relaxed">
                      {analytics?.trendExplanation || (trend === 'increasing'
                        ? 'Your breach exposure is increasing — more incidents in the last 24 months.'
                        : trend === 'declining'
                        ? 'Good news — fewer breaches in the last 24 months.'
                        : 'Your breach pattern is stable across recent periods.')}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--text-muted)] mb-2 font-mono uppercase tracking-wider">Cluster Detection</div>
                    <div className={`flex items-center gap-2 mb-2 ${analytics?.clusteredExposure ? 'text-red-500' : 'text-blue-500'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${analytics?.clusteredExposure ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <span className="font-semibold">{analytics?.clusteredExposure ? 'Clustered exposures detected' : 'No clustering pattern'}</span>
                    </div>
                    <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                      {analytics?.clusteredExposure
                        ? 'Multiple breaches occurred in a short timeframe.'
                        : 'Breaches are spread out with no unusual concentration.'}
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Tabs */}
        <div ref={simulatorRef} className="flex relative gap-1 glass rounded-2xl p-1.5 w-fit">
          {[
            { id: 'overview', label: 'Exposure Breakdown' },
            { id: 'graph', label: 'Attack Surface' },
            { id: 'simulate', label: 'Mitigation Simulator' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === t.id ? '' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
              {activeTab === t.id && (
                <motion.div layoutId="tab-pill" className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl shadow-sm" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="contents">
                <div className="lg:col-span-2 gs-card p-6">
                  <div className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" /> Risk Dimensions
                  </div>
                  <RadarChart dimensions={scoreBundle.dimensions} />
                </div>
                <div className="lg:col-span-3 gs-card p-6">
                  <div className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--accent)]" /> Exposure Timeline
                  </div>
                  <TimelineChart breaches={breaches} />
                </div>
              </motion.div>
            )}
            {activeTab === 'graph' && (
              <motion.div key="graph" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="lg:col-span-5 gs-card p-6" style={{ minHeight: 420 }}>
                <div className="font-semibold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" /> Attack Surface Map
                </div>
                <AttackGraph graphData={result.graphData} />
              </motion.div>
            )}
            {activeTab === 'simulate' && (
              <motion.div key="simulate" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="lg:col-span-5">
                <MitigationSimulator baseline={scoreBundle} hygiene={result.hygiene} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between py-4 text-sm text-[var(--text-muted)] border-t border-black/[0.06] dark:border-white/[0.06]">
          <span className="font-mono">GhostScan</span>
          <button onClick={() => { sessionStorage.clear(); router.push('/') }} className="flex items-center gap-2 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete All Data
          </button>
        </div>
      </div>

      <DeletionCenter open={showDeletion} onClose={() => setShowDeletion(false)} email={email} breaches={breaches} scanId={result.scanId} userState={userState} />
      <GeminiChatWidget />
    </div>
  )
}
