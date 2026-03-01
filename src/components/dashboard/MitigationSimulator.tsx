'use client'
import { useMemo, useState } from 'react'
import { TrendingDown, CheckCircle2, Lock, Key, Shield, EyeOff, WandSparkles } from 'lucide-react'

interface Props {
  baseline: { finalScore: number; level: string; dimensions: { takeover: number; theft: number; phishing: number; exposure: number } }
  hygiene: { uses2FA: boolean; reusesPasswords: boolean; usesPasswordManager: boolean }
}

type Toggles = { enable2FA: boolean; stopReuse: boolean; removeGravatar: boolean; usePasswordManager: boolean }
type MitigationId = keyof Toggles

function simulateLocal(baseline: Props['baseline'], hygiene: Props['hygiene'], toggles: Toggles) {
  let t = baseline.dimensions.takeover, th = baseline.dimensions.theft, p = baseline.dimensions.phishing, e = baseline.dimensions.exposure
  const clamp = (n: number) => Math.max(0, Math.min(100, n))
  if (toggles.enable2FA && !hygiene.uses2FA) t = clamp(t - 20)
  if (toggles.stopReuse && hygiene.reusesPasswords) t = clamp(t - 30)
  if (toggles.usePasswordManager && !hygiene.usesPasswordManager) t = clamp(t - 15)
  if (toggles.removeGravatar) { p = clamp(p - 15); e = clamp(e - 20) }
  return { simScore: Math.round(0.35 * t + 0.25 * th + 0.20 * p + 0.20 * e), dimensions: { takeover: t, theft: th, phishing: p, exposure: e } }
}

export default function MitigationSimulator({ baseline, hygiene }: Props) {
  const [toggles, setToggles] = useState<Toggles>({ enable2FA: false, stopReuse: false, removeGravatar: false, usePasswordManager: false })

  const mitigations = useMemo(() => ([
    { id: 'enable2FA' as MitigationId, icon: Shield, label: 'Enable Two-Factor Authentication', desc: 'Blocks account takeover even with a leaked password.', impact: '-20 Takeover', disabled: hygiene.uses2FA, disabledMsg: 'Already enabled' },
    { id: 'stopReuse' as MitigationId, icon: Lock, label: 'Stop Reusing Passwords', desc: 'Use unique passwords for every account.', impact: '-30 Takeover', disabled: !hygiene.reusesPasswords, disabledMsg: 'Already unique' },
    { id: 'usePasswordManager' as MitigationId, icon: Key, label: 'Use a Password Manager', desc: 'Bitwarden or 1Password can reduce takeover risk quickly.', impact: '-15 Takeover', disabled: hygiene.usesPasswordManager, disabledMsg: 'Already using one' },
    { id: 'removeGravatar' as MitigationId, icon: EyeOff, label: 'Remove Public Gravatar Profile', desc: 'Reduces social engineering and public exposure.', impact: '-15 Phishing, -20 Exposure', disabled: false, disabledMsg: '' },
  ]), [hygiene])

  const simResult = useMemo(() => simulateLocal(baseline, hygiene, toggles), [baseline, hygiene, toggles])
  const delta = baseline.finalScore - simResult.simScore
  const pct = baseline.finalScore > 0 ? Math.round((delta / baseline.finalScore) * 100) : 0

  const perActionImpact = useMemo(() => {
    const impacts: Record<MitigationId, number> = { enable2FA: 0, stopReuse: 0, usePasswordManager: 0, removeGravatar: 0 }
    ;(Object.keys(impacts) as MitigationId[]).forEach((id) => {
      const t: Toggles = { enable2FA: false, stopReuse: false, usePasswordManager: false, removeGravatar: false }
      t[id] = true
      impacts[id] = Math.max(0, baseline.finalScore - simulateLocal(baseline, hygiene, t).simScore)
    })
    return impacts
  }, [baseline, hygiene])

  const bestCaseToggles: Toggles = { enable2FA: !hygiene.uses2FA, stopReuse: hygiene.reusesPasswords, usePasswordManager: !hygiene.usesPasswordManager, removeGravatar: true }
  const bestCase = simulateLocal(baseline, hygiene, bestCaseToggles)
  const bestCaseDelta = baseline.finalScore - bestCase.simScore
  const actionableCount = mitigations.filter((m) => !m.disabled).length

  const applyBestActions = () => {
    const top = [...mitigations].filter((m) => !m.disabled).sort((a, b) => perActionImpact[b.id] - perActionImpact[a.id]).slice(0, 2).map((m) => m.id)
    const next: Toggles = { enable2FA: false, stopReuse: false, removeGravatar: false, usePasswordManager: false }
    top.forEach((id) => { next[id] = true })
    setToggles(next)
  }

  return (
    <div className="space-y-6">
      <div className="gs-card p-6 bg-gradient-to-r from-red-500/[0.04] dark:from-red-500/[0.08] to-transparent">
        <h2 className="font-heading text-2xl font-bold mb-2">What Should I Do?</h2>
        <p className="text-[var(--text-muted)] text-lg leading-relaxed">
          Toggle the actions below to see how they would reduce your risk score.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 gs-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="font-semibold text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-[var(--accent)]" /> Available Actions
            </div>
            <button onClick={applyBestActions} className="gs-btn-ghost py-2 px-4 flex items-center gap-2">
              <WandSparkles className="w-4 h-4" /> Apply Best 2
            </button>
          </div>

          {actionableCount === 0 && (
            <div className="mb-4 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
              All high-impact mitigations are already in place.
            </div>
          )}

          <div className="space-y-3">
            {mitigations.map((m) => {
              const active = toggles[m.id]
              const estimated = perActionImpact[m.id]
              return (
                <button key={m.id} disabled={m.disabled}
                  onClick={() => !m.disabled && setToggles((t) => ({ ...t, [m.id]: !t[m.id] }))}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                    m.disabled ? 'opacity-40 cursor-default border-transparent glass' :
                    active ? 'border-[var(--accent)]/30 bg-[var(--accent)]/5' : 'border-transparent glass hover:border-black/[0.08] dark:hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-6 h-6 mt-0.5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-colors ${active ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-gray-300 dark:border-gray-600'}`}>
                      {(active || m.disabled) && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold">{m.label}</span>
                      {m.disabled && <span className="text-sm text-[var(--text-muted)] font-mono ml-2">({m.disabledMsg})</span>}
                      <p className="text-sm text-[var(--text-muted)] mt-1">{m.desc}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="block text-sm font-mono font-bold text-[var(--accent)]">{m.impact}</span>
                      <span className="block text-sm text-[var(--text-muted)] mt-1">~{estimated} pts</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="gs-card p-6 flex flex-col justify-between">
          <div>
            <div className="font-semibold text-lg mb-6">Score Impact</div>
            <div className="mb-4">
              <div className="text-sm text-[var(--text-muted)] mb-1 font-mono">CURRENT</div>
              <div className="text-4xl font-extrabold font-mono text-red-500">{baseline.finalScore}</div>
              <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-red-400 rounded-full transition-all duration-700" style={{ width: `${baseline.finalScore}%` }} />
              </div>
            </div>
            <div className="mb-5">
              <div className="text-sm text-[var(--text-muted)] mb-1 font-mono">AFTER</div>
              <div className="text-4xl font-extrabold font-mono text-blue-500">{simResult.simScore}</div>
              <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all duration-700" style={{ width: `${simResult.simScore}%` }} />
              </div>
            </div>
            <div className="mb-5 glass rounded-xl p-4">
              <div className="text-sm text-[var(--text-muted)] font-mono">BEST POSSIBLE</div>
              <div className="text-2xl font-extrabold font-mono text-blue-500 mt-1">{bestCase.simScore}</div>
              <div className="text-sm text-blue-500 mt-1">Max reduction: -{bestCaseDelta} pts</div>
            </div>
            {delta > 0 ? (
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-5 text-center">
                <div className="text-4xl font-extrabold text-blue-500 font-mono">-{delta} pts</div>
                <div className="text-lg text-blue-600 dark:text-blue-400 mt-1">~{pct}% reduction</div>
              </div>
            ) : (
              <div className="glass rounded-xl p-5 text-center text-[var(--text-muted)]">
                Toggle actions above to see the impact.
              </div>
            )}
          </div>
          <div className="mt-6 space-y-2.5">
            {Object.entries(simResult.dimensions).map(([key, val]) => {
              const v = val as number
              const b = baseline.dimensions[key as keyof typeof baseline.dimensions]
              const diff = b - v
              const barColor = v > 65 ? 'bg-red-400' : v > 35 ? 'bg-amber-400' : 'bg-blue-400'
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[var(--text-muted)] w-24 text-sm capitalize">{key}</span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${v}%` }} />
                  </div>
                  <span className="font-mono w-8 text-right text-sm">{v}</span>
                  {diff > 0 && <span className="font-mono text-blue-500 text-sm">-{diff}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
