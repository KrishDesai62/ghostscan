'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Zap, Database, Mail, Lock, Eye, AlertTriangle, ArrowRight } from 'lucide-react'
import { DATA_BROKERS } from '@/lib/data-brokers'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { AnimatedStagger, AnimatedStaggerItem } from '@/components/ui/AnimatedStagger'
import { TiltCard } from '@/components/ui/TiltCard'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const STATS = [
  { value: '14B+', label: 'Records breached worldwide' },
  { value: String(DATA_BROKERS.length), label: 'Data brokers tracked' },
  { value: '3', label: 'Legal templates ready' },
  { value: '<2min', label: 'Full scan time' },
]

const FEATURES = [
  { icon: Shield, title: 'Verified Identity', desc: 'Email OTP and liveness check ensures only you can access your report.', iconBg: 'bg-red-50 dark:bg-red-500/10 text-red-500' },
  { icon: Database, title: 'Breach Intelligence', desc: 'Cross-references 14 billion+ leaked credentials from verified sources.', iconBg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' },
  { icon: Mail, title: 'Data Removal', desc: 'Send legally-sound deletion requests to companies holding your data.', iconBg: 'bg-violet-50 dark:bg-violet-500/10 text-violet-500' },
  { icon: Zap, title: 'Risk Simulation', desc: 'See exactly how much each mitigation action reduces your risk score.', iconBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Enter your email', desc: 'We verify your identity with a one-time code.' },
  { step: '02', title: 'We scan for breaches', desc: 'Cross-referencing 14B+ records in real-time.' },
  { step: '03', title: 'Get your risk report', desc: 'Detailed breakdown of your digital exposure.' },
  { step: '04', title: 'Take action', desc: 'Send deletion requests and reduce your risk.' },
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
    <main className="min-h-screen relative overflow-hidden">
      {/* Gradient blobs */}
      <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] bg-red-500/[0.06] dark:bg-red-500/[0.08] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[200px] right-[-200px] w-[500px] h-[500px] bg-blue-500/[0.04] dark:bg-blue-500/[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[30%] w-[400px] h-[400px] bg-red-500/[0.03] dark:bg-red-500/[0.05] rounded-full blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 lg:px-16 py-5 border-b border-black/[0.06] dark:border-white/[0.06] glass-nav">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--accent)] rounded-xl flex items-center justify-center">
            <Eye className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">Ghost<span className="text-[var(--accent)]">Scan</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Lock className="w-4 h-4" />
            <span>No data stored without consent</span>
          </div>
          <ThemeToggle />
          <button onClick={() => router.push('/verify')} className="gs-btn-primary text-sm py-2.5 px-5">
            Get Started <ArrowRight className="w-4 h-4 ml-1 inline" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-8 lg:px-16 pt-24 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <AnimatedSection variant="fadeUp">
              <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 text-sm text-[var(--accent)] font-mono">
                <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />
                Real-time breach intelligence
              </div>
            </AnimatedSection>

            <AnimatedStagger staggerDelay={0.12}>
              <AnimatedStaggerItem>
                <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-3">
                  Know What
                </h1>
              </AnimatedStaggerItem>
              <AnimatedStaggerItem>
                <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-3">
                  They Know.
                </h1>
              </AnimatedStaggerItem>
              <AnimatedStaggerItem>
                <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-8">
                  <span className="text-[var(--accent)]">Take It Back.</span>
                </h1>
              </AnimatedStaggerItem>
            </AnimatedStagger>

            <AnimatedSection variant="fadeUp" delay={0.3}>
              <p className="text-[var(--text-muted)] text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
                Scan your email against 14 billion+ breached records, get your risk score, and send
                legally-sound deletion requests to every company holding your data.
              </p>
            </AnimatedSection>

            <AnimatedSection variant="fadeUp" delay={0.4}>
              <form onSubmit={handleStart} className="max-w-lg mb-4">
                <div className={`flex items-center glass rounded-2xl overflow-hidden transition-all duration-300 ${focused ? 'shadow-lg shadow-[var(--accent-glow)] !border-[var(--accent)]/40' : ''}`}>
                  <Mail className="w-5 h-5 text-[var(--text-muted)] ml-5 flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="flex-1 bg-transparent px-4 py-4 outline-none font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  />
                  <button type="submit" className="m-1.5 gs-btn-primary flex items-center gap-2 py-3.5 whitespace-nowrap">
                    Scan Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
              <p className="text-sm text-[var(--text-muted)]">
                OTP-verified · No passwords stored · GDPR/CCPA compliant
              </p>
            </AnimatedSection>
          </div>

          {/* Floating glass cards */}
          <div className="hidden lg:block relative h-[500px]">
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-8 left-12 glass rounded-2xl p-5 w-64 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold">5 Breaches Found</div>
                  <div className="text-sm text-[var(--text-muted)]">High risk detected</div>
                </div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-red-500 to-amber-500 rounded-full" />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, -2, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute top-48 right-4 glass rounded-2xl p-5 w-56 shadow-xl"
            >
              <div className="text-4xl font-extrabold font-mono text-[var(--accent)] mb-1">73</div>
              <div className="text-sm text-[var(--text-muted)]">Risk Score</div>
              <div className="text-sm text-amber-500 font-medium mt-2">Moderate Risk</div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute bottom-12 left-8 glass rounded-2xl p-4 w-60 shadow-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-sm font-semibold">Deletion Sent</span>
              </div>
              <div className="text-sm text-[var(--text-muted)]">GDPR request sent to LinkedIn</div>
              <div className="mt-2 text-sm text-[var(--accent)] font-mono">Status: Pending</div>
            </motion.div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="animate-orbit">
                <div className="w-3 h-3 bg-[var(--accent)] rounded-full shadow-[0_0_12px_var(--accent-glow)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-y border-black/[0.06] dark:border-white/[0.06] glass-nav">
        <AnimatedStagger className="max-w-[1400px] mx-auto px-8 lg:px-16 grid grid-cols-2 md:grid-cols-4 divide-x divide-black/[0.06] dark:divide-white/[0.06]" staggerDelay={0.08}>
          {STATS.map(s => (
            <AnimatedStaggerItem key={s.value} className="py-8 px-6 text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-[var(--accent)] font-mono mb-1">{s.value}</div>
              <div className="text-sm text-[var(--text-muted)]">{s.label}</div>
            </AnimatedStaggerItem>
          ))}
        </AnimatedStagger>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-8 lg:px-16 py-24">
        <AnimatedSection variant="fadeUp">
          <div className="text-sm font-mono text-[var(--accent)] mb-3 uppercase tracking-wider">How it works</div>
          <h2 className="font-heading text-3xl md:text-4xl font-extrabold mb-16">Four steps to digital safety</h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((item, i) => (
            <AnimatedSection key={item.step} variant="fadeUp" delay={i * 0.1}>
              <TiltCard className="gs-card p-6 h-full group hover:shadow-lg transition-all">
                <div className="text-5xl font-extrabold font-heading text-gray-200 dark:text-white/5 group-hover:text-red-100 dark:group-hover:text-red-500/10 transition-colors mb-4">{item.step}</div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
              </TiltCard>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-8 lg:px-16 pb-24">
        <AnimatedSection variant="fadeUp">
          <div className="text-sm font-mono text-[var(--accent)] mb-3 uppercase tracking-wider">Features</div>
          <h2 className="font-heading text-3xl md:text-4xl font-extrabold mb-16">Everything you need to protect yourself</h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <AnimatedSection key={f.title} variant="fadeUp" delay={i * 0.08}>
              <TiltCard className="gs-card p-7 flex gap-5 hover:shadow-lg transition-all group">
                <div className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg font-bold mb-1">{f.title}</div>
                  <div className="text-[var(--text-muted)] leading-relaxed">{f.desc}</div>
                </div>
              </TiltCard>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-8 lg:px-16 pb-20">
        <AnimatedSection variant="fadeUp">
          <div className="gs-card p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.04] to-blue-500/[0.04] dark:from-red-500/[0.08] dark:to-blue-500/[0.08]" />
            <div className="relative z-10">
              <h2 className="font-heading text-3xl md:text-4xl font-extrabold mb-4">Ready to see your exposure?</h2>
              <p className="text-[var(--text-muted)] text-lg mb-8 max-w-lg mx-auto">
                It takes less than 2 minutes. No credit card required.
              </p>
              <button onClick={() => router.push('/verify')} className="gs-btn-primary text-lg py-4 px-10">
                Start Your Free Scan <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-black/[0.06] dark:border-white/[0.06] py-8 px-8 lg:px-16 glass-nav">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between text-sm text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[var(--accent)]" />
            <span>GhostScan</span>
          </div>
          <span>Open source breach intelligence</span>
        </div>
      </footer>
    </main>
  )
}
