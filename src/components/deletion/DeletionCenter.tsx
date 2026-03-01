'use client'
import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Shield, Mail, ExternalLink, Download, Copy, CheckCircle2, ChevronDown, ChevronUp, Search, Filter, Send, AlertCircle, Globe, FileText, Zap, Sparkles } from 'lucide-react'
import { getRecommendedBrokersForUser, type DataBroker } from '@/lib/data-brokers'
import { generateLegalEmail, generateEmlContent, generateMailtoUrl, type LegalRegime } from '@/lib/legal-templates'
import { getPrivacyLawProfile, type ResidencyState } from '@/lib/us-privacy-laws'

interface Breach {
  breach_name: string
  breach_domain: string
  breach_date: string
  data_classes: string[]
  pwn_count: number
}

interface DeletionRequest {
  targetId: string
  targetName: string
  status: 'pending' | 'queued' | 'sent' | 'awaiting_response' | 'deleted' | 'failed'
  regime: LegalRegime
  refId?: string
  sentAt?: Date
}

interface Props {
  open: boolean
  onClose: () => void
  email: string
  breaches: Breach[]
  scanId?: string
  userState?: string
}

type TabId = 'brokers' | 'breaches' | 'sent'
type FilterRegime = 'all' | 'us_state_delete' | 'gdpr' | 'ccpa'

export default function DeletionCenter({ open, onClose, email, breaches, scanId, userState = 'US_OTHER' }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('brokers')
  const [search, setSearch] = useState('')
  const [filterRegime, setFilterRegime] = useState<FilterRegime>('all')
  const [requests, setRequests] = useState<Record<string, DeletionRequest>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<{ subject: string; body: string; to: string; refId: string } | null>(null)
  const [previewRegime, setPreviewRegime] = useState<LegalRegime>('gdpr')
  const [aiPolishing, setAiPolishing] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const userName = email.split('@')[0]
  const lawProfile = getPrivacyLawProfile(userState as ResidencyState)
  const brokerTargets = getRecommendedBrokersForUser({
    email,
    userState,
    breachCount: breaches.length,
  })

  // Filter brokers
  const filteredBrokers = brokerTargets.filter(b => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase())
    const templateRegimes = getTemplateRegimesForBroker(b)
    const matchRegime = filterRegime === 'all' || templateRegimes.includes(filterRegime as LegalRegime)
    return matchSearch && matchRegime
  })

  // Stats
  const sentCount   = Object.values(requests).filter(r => r.status === 'sent').length
  const deletedCount= Object.values(requests).filter(r => r.status === 'deleted').length
  const totalTargets= brokerTargets.length + breaches.length

  function getEmailForTarget(target: DataBroker | Breach, regime: LegalRegime) {
    const isBroker = 'privacyEmail' in target
    const effectiveRegime: LegalRegime =
      isBroker && lawProfile.recommendedRegime === 'us_state_delete' && regime === 'ccpa'
        ? 'us_state_delete'
        : regime
    return generateLegalEmail({
      userEmail: email,
      userName,
      targetName: isBroker ? target.name : (target as Breach).breach_name,
      targetEmail: isBroker ? target.privacyEmail : `privacy@${(target as Breach).breach_domain}`,
      regime: effectiveRegime,
      targetType: isBroker ? 'broker' : 'breach',
      requestType: isBroker ? 'combined' : 'delete',
      dataClasses: isBroker ? undefined : (target as Breach).data_classes,
      breachDate:  isBroker ? undefined : (target as Breach).breach_date,
      stateLabel: lawProfile.label,
      stateLawName: lawProfile.lawName,
    })
  }

  function getTemplateRegimesForBroker(broker: DataBroker): LegalRegime[] {
    const regimes: LegalRegime[] = []
    if (lawProfile.recommendedRegime === 'us_state_delete') {
      regimes.push('us_state_delete')
      return regimes
    } else if (lawProfile.recommendedRegime === 'ccpa') {
      regimes.push('ccpa')
    } else {
      regimes.push('gdpr')
    }

    if (broker.supportedRegimes.includes('gdpr') && !regimes.includes('gdpr')) regimes.push('gdpr')
    if (broker.supportedRegimes.includes('ccpa') && !regimes.includes('ccpa')) regimes.push('ccpa')
    return regimes
  }

  function regimeLabel(regime: LegalRegime): string {
    if (regime === 'us_state_delete') return `${lawProfile.label} State Law`
    if (regime === 'gdpr') return 'GDPR'
    if (regime === 'ccpa') return 'CCPA'
    return 'Breach Erasure'
  }

  function handleOpenInMail(target: DataBroker | Breach, regime: LegalRegime, targetId: string) {
    const output = getEmailForTarget(target, regime)
    const mailto = generateMailtoUrl(output)
    window.open(mailto, '_blank')
    queueRequest(targetId, regime, output.refId, target)
  }

  function handleDownloadEml(target: DataBroker | Breach, regime: LegalRegime, targetId: string) {
    const output = getEmailForTarget(target, regime)
    const eml = generateEmlContent(output)
    const blob = new Blob([eml], { type: 'message/rfc822' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = output.filename.replace('.txt', '.eml'); a.click()
    URL.revokeObjectURL(url)
    queueRequest(targetId, regime, output.refId, target)
  }

  function handleDownloadTxt(target: DataBroker | Breach, regime: LegalRegime, targetId: string) {
    const output = getEmailForTarget(target, regime)
    const blob = new Blob([output.body], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = output.filename; a.click()
    URL.revokeObjectURL(url)
    queueRequest(targetId, regime, output.refId, target)
  }

  function handleCopy(target: DataBroker | Breach, regime: LegalRegime, targetId: string) {
    const output = getEmailForTarget(target, regime)
    navigator.clipboard.writeText(`To: ${output.to}\nSubject: ${output.subject}\n\n${output.body}`)
    setCopiedId(targetId)
    setTimeout(() => setCopiedId(null), 2000)
    queueRequest(targetId, regime, output.refId, target)
  }

  function handlePreview(target: DataBroker | Breach, regime: LegalRegime) {
    const output = getEmailForTarget(target, regime)
    setPreviewContent({ subject: output.subject, body: output.body, to: output.to, refId: output.refId })
    setPreviewRegime(regime)
    setAiError(null)
    setPreviewId('preview-open')
  }

  async function handleAiPolishPreview() {
    if (!previewContent) return
    setAiPolishing(true)
    setAiError(null)
    try {
      const res = await fetch('/api/legal-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: previewContent.subject,
          body: previewContent.body,
          regime: previewRegime,
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'AI assist failed')
      }
      const payload = await res.json()
      setPreviewContent((prev) => prev ? { ...prev, body: payload.body } : prev)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI assist failed')
    } finally {
      setAiPolishing(false)
    }
  }

  function queueRequest(targetId: string, regime: LegalRegime, refId: string, target: DataBroker | Breach) {
    const isBroker = 'privacyEmail' in target
    setRequests(r => ({
      ...r,
      [targetId]: {
        targetId, regime, refId,
        targetName: isBroker ? target.name : (target as Breach).breach_name,
        status: 'queued',
      },
    }))
  }

  function markSent(targetId: string) {
    setRequests(r => ({
      ...r,
      [targetId]: {
        ...r[targetId],
        status: 'sent',
        sentAt: new Date(),
      },
    }))
  }

  function markAwaitingResponse(targetId: string) {
    setRequests(r => ({
      ...r,
      [targetId]: {
        ...r[targetId],
        status: 'awaiting_response',
      },
    }))
  }

  function handleSendAll() {
    const unsentBrokers = filteredBrokers.filter(b => !requests[b.id])
    unsentBrokers.forEach(b => {
      const preferredRegime: LegalRegime =
        lawProfile.recommendedRegime === 'us_state_delete'
          ? 'us_state_delete'
          : lawProfile.recommendedRegime === 'gdpr'
            ? 'gdpr'
            : 'ccpa'
      const regime: LegalRegime =
        preferredRegime === 'us_state_delete'
          ? 'us_state_delete'
          : b.supportedRegimes.includes(preferredRegime)
            ? preferredRegime
            : (b.supportedRegimes.includes('gdpr') ? 'gdpr' : 'ccpa')
      const output = getEmailForTarget(b, regime)
      setRequests(r => ({
        ...r,
        [b.id]: { targetId: b.id, regime, refId: output.refId, targetName: b.name, status: 'queued' },
      }))
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <div key="deletion-center" className="contents">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98, x: 40 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-[var(--bg)] border-l border-black/[0.06] dark:border-white/[0.06] flex flex-col shadow-2xl"
          >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 glass-nav border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--text)] text-lg">Data Removal Center</h2>
              <p className="text-sm text-[var(--text-muted)]">{totalTargets} targets · {sentCount} sent · {deletedCount} confirmed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSendAll} className="gs-btn-ghost text-sm flex items-center gap-2 py-2">
              <Zap className="w-4 h-4 text-amber-500" /> Queue All
            </button>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Explainer */}
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.06] bg-red-50 dark:bg-red-500/10">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            <span className="font-bold text-red-500">How this works:</span> GhostScan generates pre-written legal emails (GDPR, CCPA, or your state law) addressed to each data broker or breach source.
            Click &ldquo;Open in Mail&rdquo; to send them from your email, or download the template. These are real deletion requests — companies are legally required to respond.
          </p>
        </div>

        <div className="px-6 py-2 border-b border-black/[0.06] dark:border-white/[0.06] bg-[var(--card-bg)]">
          <p className="text-sm text-[var(--text-muted)]">
            Region: <span className="text-[var(--text)] font-medium">{lawProfile.label}</span> · Law: <span className="text-[var(--text)] font-medium">{lawProfile.lawName}</span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[var(--text-muted)]">Removal progress</span>
            <span className="font-mono text-[var(--text)]">{sentCount + deletedCount} / {totalTargets} actioned</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
              style={{ width: `${((sentCount + deletedCount) / totalTargets) * 100}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-black/[0.06] dark:border-white/[0.06] bg-[var(--card-bg)]">
          {[
            { id: 'brokers', label: `Data Brokers (${brokerTargets.length})` },
            { id: 'breaches', label: `Breach Sources (${breaches.length})` },
            { id: 'sent', label: `Sent (${sentCount})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabId)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === t.id ? 'border-red-500 text-[var(--text)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + filter */}
        {activeTab !== 'sent' && (
          <div className="flex gap-2 px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex-1 flex items-center gap-2 bg-[var(--card-bg)] border border-black/[0.06] dark:border-white/[0.06] rounded-lg px-3 py-2">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                placeholder="Search targets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none text-[var(--text)] placeholder:text-[var(--text-muted)] font-mono"
              />
            </div>
            {activeTab === 'brokers' && (
              <select
                value={filterRegime}
                onChange={e => setFilterRegime(e.target.value as FilterRegime)}
                className="bg-[var(--card-bg)] border border-black/[0.06] dark:border-white/[0.06] rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] outline-none"
              >
                <option value="all">All Regimes</option>
                <option value="us_state_delete">{lawProfile.label} State Law</option>
                <option value="gdpr">GDPR</option>
                <option value="ccpa">CCPA</option>
              </select>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ─── BROKERS TAB ─────────────────────────────────── */}
          {activeTab === 'brokers' && (
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {filteredBrokers.map(broker => {
                const req = requests[broker.id]
                const isExpanded = expanded === broker.id
                const templateRegimes = getTemplateRegimesForBroker(broker)
                const defaultRegime: LegalRegime = templateRegimes[0]

                return (
                  <div key={broker.id} className={`transition-colors ${req ? 'bg-red-500/[0.02]' : ''}`}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : broker.id)}
                    >
                      {/* Status dot */}
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        req?.status === 'deleted' ? 'bg-red-500' :
                        req?.status === 'sent'    ? 'bg-[#fbbf24] animate-pulse' :
                        req?.status === 'awaiting_response' ? 'bg-[#60a5fa]' :
                        req?.status === 'queued'  ? 'bg-[#60a5fa] animate-pulse' :
                        'bg-black/10 dark:bg-white/10'
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[var(--text)]">{broker.name}</span>
                          <span className="text-xs text-[var(--text-muted)] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded">{broker.category}</span>
                          {broker.supportedRegimes.map(r => (
                            <span key={r} className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${r === 'gdpr' ? 'text-[#60a5fa] border-[#60a5fa44] bg-[#60a5fa11]' : 'text-amber-500 border-[#fbbf2444] bg-[#fbbf2411]'}`}>{r.toUpperCase()}</span>
                          ))}
                          {lawProfile.recommendedRegime === 'us_state_delete' && (
                            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded border text-[#f8a5ff] border-[#f8a5ff44] bg-[#f8a5ff11]">STATE LAW</span>
                          )}
                          {broker.hasOnlinePortal && <span className="text-red-500 text-xs flex items-center gap-0.5"><Globe className="w-2.5 h-2.5" /> Portal</span>}
                        </div>
                        {req && (
                          <p className="text-xs font-mono text-amber-500 mt-0.5">
                            {req.status === 'sent' ? `✓ Sent · Ref: ${req.refId}` :
                             req.status === 'awaiting_response' ? `↗ Portal submitted · Ref: ${req.refId}` :
                             req.status === 'queued' ? '⏳ Queued' :
                             req.status === 'deleted' ? '✓ Confirmed deleted' : req.status}
                          </p>
                        )}
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); handleOpenInMail(broker, defaultRegime, broker.id) }}
                          className="flex items-center gap-1 text-xs bg-red-500 text-white font-bold px-2.5 py-1.5 rounded-md hover:bg-red-600 transition-colors shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                          title="Open in Mail app"
                        >
                          <Mail className="w-3 h-3" /> Open in Mail
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                      </div>
                    </div>

                    {/* Expanded options */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-[var(--card-bg)] border-t border-black/[0.06] dark:border-white/[0.06]">
                        <div className="pt-3 space-y-3">
                          {/* Email preview */}
                          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="font-mono">{broker.privacyEmail}</span>
                            {broker.hasOnlinePortal && (
                              <a href={broker.privacyUrl} target="_blank" rel="noopener noreferrer"
                                className="ml-auto flex items-center gap-1 text-[#60a5fa] hover:underline">
                                <Globe className="w-3 h-3" /> Opt-out portal
                              </a>
                            )}
                          </div>

                          {/* Regime selector + actions */}
                          <div className="grid grid-cols-2 gap-2">
                            {templateRegimes.map(regime => (
                              <div key={regime} className="space-y-2">
                                <div className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">{regimeLabel(regime)} Template</div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <button
                                    onClick={() => handleOpenInMail(broker, regime, broker.id)}
                                    className="flex items-center justify-center gap-1 text-xs bg-red-500 text-white font-bold px-2 py-2 rounded-md hover:bg-red-600 transition-colors"
                                  >
                                    <Mail className="w-3 h-3" /> Open Mail
                                  </button>
                                  <button
                                    onClick={() => handleDownloadEml(broker, regime, broker.id)}
                                    className="flex items-center justify-center gap-1 text-xs gs-btn-ghost px-2 py-1.5"
                                  >
                                    <Download className="w-3 h-3" /> .eml
                                  </button>
                                  <button
                                    onClick={() => handleDownloadTxt(broker, regime, broker.id)}
                                    className="flex items-center justify-center gap-1 text-xs gs-btn-ghost px-2 py-1.5"
                                  >
                                    <FileText className="w-3 h-3" /> .txt
                                  </button>
                                  <button
                                    onClick={() => handleCopy(broker, regime, broker.id)}
                                    className="flex items-center justify-center gap-1 text-xs gs-btn-ghost px-2 py-1.5"
                                  >
                                    {copiedId === broker.id ? <CheckCircle2 className="w-3 h-3 text-red-500" /> : <Copy className="w-3 h-3" />}
                                    Copy
                                  </button>
                                </div>
                                <button
                                  onClick={() => handlePreview(broker, regime)}
                                  className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center gap-1 py-1"
                                >
                                  <FileText className="w-3 h-3" /> Preview email text
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Mark as handled */}
                          {req?.status === 'sent' && (
                            <button
                              onClick={() => setRequests(r => ({ ...r, [broker.id]: { ...r[broker.id], status: 'deleted' } }))}
                              className="w-full text-xs text-red-500 border border-red-500/20 rounded-lg py-2 hover:bg-red-500/[0.07] transition-colors"
                            >
                              ✓ Mark as confirmed deleted
                            </button>
                          )}
                          {req?.status === 'queued' && (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => markSent(broker.id)}
                                className="text-xs text-red-500 border border-red-500/20 rounded-lg py-2 hover:bg-red-500/[0.07] transition-colors"
                              >
                                I sent this email
                              </button>
                              <button
                                onClick={() => setRequests(r => { const next = { ...r }; delete next[broker.id]; return next })}
                                className="text-xs text-[var(--text-muted)] border border-black/[0.06] dark:border-white/[0.06] rounded-lg py-2 hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors"
                              >
                                Cancel queue
                              </button>
                            </div>
                          )}
                          {broker.hasOnlinePortal && (
                            <button
                              onClick={() => {
                                window.open(broker.privacyUrl, '_blank', 'noopener,noreferrer')
                                const output = getEmailForTarget(broker, defaultRegime)
                                queueRequest(broker.id, defaultRegime, output.refId, broker)
                                markAwaitingResponse(broker.id)
                              }}
                              className="w-full text-xs text-[#60a5fa] border border-[#60a5fa33] rounded-lg py-2 hover:bg-[#60a5fa11] transition-colors"
                            >
                              Open portal and mark awaiting response
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ─── BREACHES TAB ────────────────────────────────── */}
          {activeTab === 'breaches' && (
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {breaches.map(breach => {
                const targetId = `breach-${breach.breach_name}`
                const req = requests[targetId]
                const isExpanded = expanded === targetId

                return (
                  <div key={targetId} className={`transition-colors ${req ? 'bg-red-500/[0.02]' : ''}`}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : targetId)}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${req?.status === 'sent' ? 'bg-[#fbbf24] animate-pulse' : req?.status === 'deleted' ? 'bg-red-500' : 'bg-[#f87171]'}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[var(--text)]">{breach.breach_name}</span>
                          <span className="gs-badge-high">BREACH</span>
                          <span className="text-xs text-[var(--text-muted)]">{(breach.pwn_count / 1e6).toFixed(0)}M records · {breach.breach_date?.split('-')[0]}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {breach.data_classes.slice(0, 4).map(dc => (
                            <span key={dc} className="text-xs bg-[#f8717111] border border-[#f8717122] text-[#f8717188] px-1.5 py-0.5 rounded font-mono">{dc}</span>
                          ))}
                          {breach.data_classes.length > 4 && <span className="text-xs text-[var(--text-muted)]">+{breach.data_classes.length - 4} more</span>}
                        </div>
                        {req && <p className="text-xs font-mono text-amber-500 mt-0.5">{req.status === 'sent' ? `✓ Sent · Ref: ${req.refId}` : req.status === 'queued' ? `⏳ Queued · Ref: ${req.refId}` : `↗ Awaiting response · Ref: ${req.refId}`}</p>}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); handleOpenInMail(breach, 'breach_erasure', targetId) }}
                          className="flex items-center gap-1 text-xs bg-[#f87171] text-white font-bold px-2.5 py-1.5 rounded-md hover:bg-[#e02347] transition-colors"
                        >
                          <Mail className="w-3 h-3" /> Erasure Request
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                      </div>
                    </div>

                    {/* Expanded breach options */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-[var(--card-bg)] border-t border-black/[0.06] dark:border-white/[0.06]">
                        <div className="pt-3 space-y-3">
                          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="font-mono">privacy@{breach.breach_domain}</span>
                            <a href={`https://${breach.breach_domain}`} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[#60a5fa] hover:underline">
                              <ExternalLink className="w-3 h-3" /> Visit site
                            </a>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => handleOpenInMail(breach, 'breach_erasure', targetId)} className="flex items-center justify-center gap-1 text-xs bg-[#f87171] text-white font-bold px-2 py-2 rounded-md hover:bg-[#e02347] transition-colors">
                              <Mail className="w-3 h-3" /> Open Mail
                            </button>
                            <button onClick={() => handleDownloadEml(breach, 'breach_erasure', targetId)} className="flex items-center justify-center gap-1 text-xs gs-btn-ghost px-2 py-1.5">
                              <Download className="w-3 h-3" /> .eml
                            </button>
                            <button onClick={() => handleDownloadTxt(breach, 'breach_erasure', targetId)} className="flex items-center justify-center gap-1 text-xs gs-btn-ghost px-2 py-1.5">
                              <FileText className="w-3 h-3" /> .txt
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleCopy(breach, 'breach_erasure', targetId)} className="flex items-center justify-center gap-1 text-xs gs-btn-ghost py-1.5">
                              {copiedId === targetId ? <CheckCircle2 className="w-3 h-3 text-red-500" /> : <Copy className="w-3 h-3" />} Copy All
                            </button>
                            <button onClick={() => handlePreview(breach, 'breach_erasure')} className="flex items-center justify-center gap-1 text-xs gs-btn-ghost py-1.5">
                              <FileText className="w-3 h-3" /> Preview
                            </button>
                          </div>

                          {/* Also offer GDPR/CCPA for breaches */}
                          <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-2">
                            <p className="text-xs text-[var(--text-muted)] mb-2">Also request under:</p>
                            <div className="flex gap-2">
                              <button onClick={() => handleOpenInMail(breach, 'gdpr', targetId)} className="gs-btn-ghost text-xs px-3 py-1.5">GDPR Art.17</button>
                              <button onClick={() => handleOpenInMail(breach, lawProfile.recommendedRegime === 'us_state_delete' ? 'us_state_delete' : 'ccpa', targetId)} className="gs-btn-ghost text-xs px-3 py-1.5">
                                {lawProfile.recommendedRegime === 'us_state_delete' ? `${lawProfile.label} Law` : 'CCPA §1798.105'}
                              </button>
                            </div>
                          </div>

                          {req?.status === 'sent' && (
                            <button onClick={() => setRequests(r => ({ ...r, [targetId]: { ...r[targetId], status: 'deleted' } }))}
                              className="w-full text-xs text-red-500 border border-red-500/20 rounded-lg py-2 hover:bg-red-500/[0.07] transition-colors">
                              ✓ Mark as confirmed deleted
                            </button>
                          )}
                          {req?.status === 'queued' && (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => markSent(targetId)}
                                className="text-xs text-red-500 border border-red-500/20 rounded-lg py-2 hover:bg-red-500/[0.07] transition-colors"
                              >
                                I sent this email
                              </button>
                              <button
                                onClick={() => setRequests(r => { const next = { ...r }; delete next[targetId]; return next })}
                                className="text-xs text-[var(--text-muted)] border border-black/[0.06] dark:border-white/[0.06] rounded-lg py-2 hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors"
                              >
                                Cancel queue
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ─── SENT TAB ─────────────────────────────────────── */}
          {activeTab === 'sent' && (
            <div>
              {Object.keys(requests).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                  <Send className="w-12 h-12 text-[var(--text)] mb-4" />
                  <p className="text-[var(--text-muted)] text-sm">No requests sent yet</p>
                  <p className="text-[var(--text)] text-xs mt-1">Queue from any target, then confirm with "I sent this"</p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                  {Object.values(requests).map(req => (
                    <div key={req.targetId} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${req.status === 'deleted' ? 'bg-red-500' : req.status === 'sent' ? 'bg-[#fbbf24]' : 'bg-[#60a5fa]'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[var(--text)]">{req.targetName}</span>
                          <span className="text-xs font-mono text-[var(--text-muted)] uppercase">{req.regime}</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                          Ref: {req.refId} · {req.sentAt ? `Sent ${req.sentAt.toLocaleDateString()}` : 'Queued'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold ${req.status === 'deleted' ? 'text-red-500' : req.status === 'sent' ? 'text-amber-500' : 'text-[#60a5fa]'}`}>
                          {req.status.toUpperCase()}
                        </span>
                        {req.status === 'queued' && (
                          <button
                            onClick={() => markSent(req.targetId)}
                            className="text-xs gs-btn-ghost py-1 px-2"
                          >
                            I sent this
                          </button>
                        )}
                        {req.status === 'sent' && (
                          <button
                            onClick={() => setRequests(r => ({ ...r, [req.targetId]: { ...r[req.targetId], status: 'deleted' } }))}
                            className="text-xs gs-btn-ghost py-1 px-2"
                          >
                            ✓ Confirm
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer disclaimer */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.06] px-4 py-3 bg-[var(--card-bg)]">
          <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
            <span>Legal templates are informational only and not legal advice. For complex cases, consult a qualified privacy attorney. Responses typically take 30–45 days.</span>
          </div>
        </div>
          </motion.div>

      {/* Email Preview Modal */}
      {previewId && previewContent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewId(null)}>
          <div className="bg-[var(--card-bg)] border border-black/[0.06] dark:border-white/[0.06] rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <p className="text-xs text-[var(--text-muted)] font-mono">TO: {previewContent.to}</p>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5 truncate max-w-md">SUBJECT: {previewContent.subject}</p>
              </div>
              <button onClick={() => setPreviewId(null)} className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded hover:bg-black/10 dark:hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-xs text-[var(--text)] font-mono whitespace-pre-wrap leading-relaxed">{previewContent.body}</pre>
            </div>
            <div className="px-4 py-3 border-t border-black/[0.06] dark:border-white/[0.06] flex gap-2">
              <button
                onClick={handleAiPolishPreview}
                disabled={aiPolishing}
                className="gs-btn-ghost text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" /> {aiPolishing ? 'Polishing...' : 'AI Polish'}
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(previewContent.body)}
                className="gs-btn-ghost text-xs flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              {aiError && <p className="text-[11px] text-amber-500 self-center">{aiError}</p>}
              <p className="ml-auto text-xs text-[var(--text-muted)] self-center">Ref: {previewContent.refId}</p>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </AnimatePresence>
  )
}
