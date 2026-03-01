'use client'
import { useMemo, useState } from 'react'
import { TrendingDown, CheckCircle2, Lock, Key, Shield, EyeOff, WandSparkles } from 'lucide-react'

interface Props {
  baseline: { finalScore: number; level: string; dimensions: { takeover: number; theft: number; phishing: number; exposure: number } }
  hygiene: { uses2FA: boolean; reusesPasswords: boolean; usesPasswordManager: boolean }
}

type Toggles = { enable2FA: boolean; stopReuse: boolean; removeGravatar: boolean; usePasswordManager: boolean }

type MitigationId = keyof Toggles

function simulateLocal(
  baseline: Props['baseline'],
  hygiene: Props['hygiene'],
  toggles: Toggles
) {
  let t = baseline.dimensions.takeover
  let th = baseline.dimensions.theft
  let p = baseline.dimensions.phishing
  let e = baseline.dimensions.exposure

  const clamp = (n: number) => Math.max(0, Math.min(100, n))

  if (toggles.enable2FA && !hygiene.uses2FA) t = clamp(t - 20)
  if (toggles.stopReuse && hygiene.reusesPasswords) t = clamp(t - 30)
  if (toggles.usePasswordManager && !hygiene.usesPasswordManager) t = clamp(t - 15)
  if (toggles.removeGravatar) { p = clamp(p - 15); e = clamp(e - 20) }

  const simScore = Math.round(0.35 * t + 0.25 * th + 0.20 * p + 0.20 * e)
  return { simScore, dimensions: { takeover: t, theft: th, phishing: p, exposure: e } }
}

export default function MitigationSimulator({ baseline, hygiene }: Props) {
  const [toggles, setToggles] = useState<Toggles>({ enable2FA: false, stopReuse: false, removeGravatar: false, usePasswordManager: false })

  const mitigations = useMemo(() => ([
    {
      id: 'enable2FA' as MitigationId, icon: Shield, label: 'Enable Two-Factor Authentication',
      desc: 'Blocks account takeover even with leaked password.',
      impact: '-20 Takeover', color: '#00ff9d',
      disabled: hygiene.uses2FA,
      disabledMsg: 'Already enabled',
    },
    {
      id: 'stopReuse' as MitigationId, icon: Lock, label: 'Stop Reusing Passwords',
      desc: 'Use unique passwords for every account.',
      impact: '-30 Takeover', color: '#00ff9d',
      disabled: !hygiene.reusesPasswords,
      disabledMsg: 'Already unique',
    },
    {
      id: 'usePasswordManager' as MitigationId, icon: Key, label: 'Use a Password Manager',
      desc: 'Bitwarden or 1Password can reduce takeover risk quickly.',
      impact: '-15 Takeover', color: '#4cc9f0',
      disabled: hygiene.usesPasswordManager,
      disabledMsg: 'Already using one',
    },
    {
      id: 'removeGravatar' as MitigationId, icon: EyeOff, label: 'Remove Public Gravatar Profile',
      desc: 'Reduces social engineering personalization and public exposure.',
      impact: '-15 Phishing, -20 Exposure', color: '#ffd166',
      disabled: false,
      disabledMsg: '',
    },
  ]), [hygiene])

  const simResult = useMemo(() => simulateLocal(baseline, hygiene, toggles), [baseline, hygiene, toggles])
  const delta = baseline.finalScore - simResult.simScore
  const pct = baseline.finalScore > 0 ? Math.round((delta / baseline.finalScore) * 100) : 0

  const perActionImpact = useMemo(() => {
    const impacts: Record<MitigationId, number> = {
      enable2FA: 0,
      stopReuse: 0,
      usePasswordManager: 0,
      removeGravatar: 0,
    }
    ;(Object.keys(impacts) as MitigationId[]).forEach((id) => {
      const togglesForOne: Toggles = { enable2FA: false, stopReuse: false, usePasswordManager: false, removeGravatar: false }
      togglesForOne[id] = true
      impacts[id] = Math.max(0, baseline.finalScore - simulateLocal(baseline, hygiene, togglesForOne).simScore)
    })
    return impacts
  }, [baseline, hygiene])

  const bestCaseToggles: Toggles = {
    enable2FA: !hygiene.uses2FA,
    stopReuse: hygiene.reusesPasswords,
    usePasswordManager: !hygiene.usesPasswordManager,
    removeGravatar: true,
  }
  const bestCase = simulateLocal(baseline, hygiene, bestCaseToggles)
  const bestCaseDelta = baseline.finalScore - bestCase.simScore

  const actionableCount = mitigations.filter((m) => !m.disabled).length

  const applyBestActions = () => {
    const top = [...mitigations]
      .filter((m) => !m.disabled)
      .sort((a, b) => perActionImpact[b.id] - perActionImpact[a.id])
      .slice(0, 2)
      .map((m) => m.id)

    const next: Toggles = { enable2FA: false, stopReuse: false, removeGravatar: false, usePasswordManager: false }
    top.forEach((id) => { next[id] = true })
    setToggles(next)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 gs-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#00ff9d]" /> Mitigation Actions
          </div>
          <button onClick={applyBestActions} className="gs-btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
            <WandSparkles className="w-3.5 h-3.5" /> Apply Best 2
          </button>
        </div>

        {actionableCount === 0 && (
          <div className="mb-3 text-xs text-[#ffd166] bg-[#ffd16611] border border-[#ffd16633] rounded-lg p-3">
            No direct account-hygiene actions are left to apply from your current inputs. Most high-impact mitigations are already in place.
          </div>
        )}

        <div className="space-y-3">
          {mitigations.map((m) => {
            const active = toggles[m.id]
            const estimated = perActionImpact[m.id]
            return (
              <button
                key={m.id}
                disabled={m.disabled}
                onClick={() => !m.disabled && setToggles((t) => ({ ...t, [m.id]: !t[m.id] }))}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                  m.disabled ? 'opacity-40 cursor-default border-[#1e2d45]' :
                  active ? 'border-[#00ff9d55] bg-[#00ff9d08]' : 'border-[#1e2d45] hover:border-[#1e3a5f]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${active ? 'bg-[#00ff9d] border-[#00ff9d]' : 'border-[#1e2d45]'}`}>
                    {(active || m.disabled) && <CheckCircle2 className="w-3.5 h-3.5 text-[#080b12]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white">{m.label}</span>
                      {m.disabled && <span className="text-xs text-gray-600 font-mono">({m.disabledMsg})</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-mono font-bold text-[#00ff9d]">{m.impact}</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">~{estimated} score pts</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="gs-card p-5 flex flex-col justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-300 mb-4">Score Impact</div>

          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1 font-mono">BASELINE</div>
            <div className="text-3xl font-extrabold font-mono text-[#ff3b5c]">{baseline.finalScore}</div>
            <div className="h-2 bg-[#1e2d45] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#ff3b5c] rounded-full transition-all duration-700" style={{ width: `${baseline.finalScore}%` }} />
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1 font-mono">WITH MITIGATIONS</div>
            <div className="text-3xl font-extrabold font-mono text-[#00ff9d]">{simResult.simScore}</div>
            <div className="h-2 bg-[#1e2d45] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#00ff9d] rounded-full transition-all duration-700" style={{ width: `${simResult.simScore}%` }} />
            </div>
          </div>

          <div className="mb-4 bg-[#4cc9f011] border border-[#4cc9f033] rounded-lg p-3">
            <div className="text-xs text-gray-400 font-mono">POTENTIAL BEST CASE</div>
            <div className="text-xl font-extrabold font-mono text-[#4cc9f0] mt-0.5">{bestCase.simScore}</div>
            <div className="text-xs text-[#4cc9f0] mt-1">Max reduction from available actions: -{bestCaseDelta} pts</div>
          </div>

          {delta > 0 ? (
            <div className="bg-[#00ff9d11] border border-[#00ff9d33] rounded-lg p-3 text-center">
              <div className="text-3xl font-extrabold text-[#00ff9d] font-mono">-{delta} pts</div>
              <div className="text-sm text-[#00ff9d] mt-0.5">~{pct}% risk reduction</div>
            </div>
          ) : (
            <div className="bg-[#1e2d45] rounded-lg p-3 text-center text-gray-500 text-sm">
              No reduction applied yet. Toggle actions or use "Apply Best 2".
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {Object.entries(simResult.dimensions).map(([key, val]) => {
            const v = val as number
            const b = baseline.dimensions[key as keyof typeof baseline.dimensions]
            const diff = b - v
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="text-gray-600 w-20 truncate capitalize">{key}</span>
                <div className="flex-1 h-1 bg-[#1e2d45] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${v}%`, backgroundColor: v > 65 ? '#ff3b5c' : v > 35 ? '#ffd166' : '#00ff9d' }} />
                </div>
                <span className="font-mono text-gray-400 w-8 text-right">{v}</span>
                {diff > 0 && <span className="font-mono text-[#00ff9d] text-xs">-{diff}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
