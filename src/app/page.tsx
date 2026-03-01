'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Zap, Database, Mail, ChevronRight, Lock, Eye, AlertTriangle } from 'lucide-react'
import { DATA_BROKERS } from '@/lib/data-brokers'

const STATS = [
  { value: '14B+', label: 'Records breached' },
  { value: String(DATA_BROKERS.length), label: 'Data brokers in local catalog' },
  { value: '3', label: 'Legal templates' },
  { value: '<2min', label: 'Full scan time' },
]

const FEATURES = [
  { icon: Shield, title: 'Verified Identity', desc: 'Email OTP + liveness check ensures only you can access your report' },
  { icon: Database, title: 'Breach Intelligence', desc: 'Cross-references HIBP\'s database of 14B+ leaked credentials' },
  { icon: Mail, title: 'Data Removal Center', desc: 'State-aware broker deletion/opt-out emails from a curated local catalog' },
  { icon: Zap, title: 'Risk Simulation', desc: 'See exactly how much each mitigation action reduces your score' },
]

export default function LandingPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [focused, setFocused] = useState(false)

  function handleStart(e: React.FormEvent) {
    e.preventDefault()
    const q = email ? `?email=${encodeURIComponent(email)}` : ''
    router.push(`/verify${q}`)
  }

  return (
    <main className="min-h-screen grid-bg relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00ff9d08] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#4cc9f008] rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[#1e2d45]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00ff9d] rounded-lg flex items-center justify-center">
            <Eye className="w-4 h-4 text-[#080b12]" />
          </div>
          <span className="font-bold text-lg tracking-tight">Ghost<span className="text-[#00ff9d]">Scan</span></span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Lock className="w-3.5 h-3.5" />
          <span>No data stored without consent</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#00ff9d11] border border-[#00ff9d33] rounded-full px-4 py-1.5 mb-8 text-sm text-[#00ff9d] font-mono">
          <span className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-pulse" />
          Hackathon Demo · HIBP + GDPR/CCPA Engine
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
          Know What They Know<br />
          <span className="text-[#00ff9d]">Take It Back</span>
        </h1>

        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Scan your email against 14B+ breached records, compute your risk score, 
          and send legally-sound deletion requests to every company holding your data — 
          in under 2 minutes.
        </p>

        {/* Email CTA */}
        <form onSubmit={handleStart} className="max-w-lg mx-auto mb-6">
          <div className={`flex items-center bg-[#0e1421] border rounded-xl overflow-hidden transition-all duration-200 ${focused ? 'border-[#00ff9d55] shadow-[0_0_20px_#00ff9d22]' : 'border-[#1e2d45]'}`}>
            <Mail className="w-4 h-4 text-gray-500 ml-4 flex-shrink-0" />
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="flex-1 bg-transparent px-3 py-4 text-white placeholder:text-gray-600 outline-none font-mono text-sm"
            />
            <button type="submit" className="m-1 gs-btn-primary flex items-center gap-2 py-3 whitespace-nowrap">
              Analyze Exposure
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-600 font-mono">
          OTP-verified · No passwords stored · Delete anytime · GDPR/CCPA compliant
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
          {STATS.map(s => (
            <div key={s.value} className="gs-card p-4 text-center">
              <div className="text-2xl font-extrabold text-[#00ff9d] font-mono">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="gs-card p-5 flex gap-4 hover:border-[#1e3a5f] transition-colors">
              <div className="w-10 h-10 bg-[#00ff9d11] rounded-lg flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-[#00ff9d]" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1">{f.title}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Warning banner */}
        <div className="mt-8 gs-card border-[#ffd16633] p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#ffd166] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="text-[#ffd166] font-semibold">Demo Mode: </span>
            Without a HIBP API key, GhostScan returns realistic mock breach data for demonstration. 
            Legal templates are informational only and do not constitute legal advice. 
            Set <code className="font-mono text-gray-400 bg-[#1e2d45] px-1 rounded">HIBP_API_KEY</code> in .env.local for live data.
          </p>
        </div>
      </div>
    </main>
  )
}
