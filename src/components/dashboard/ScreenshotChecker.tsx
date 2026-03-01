'use client'
import { useMemo, useState } from 'react'
import { AlertTriangle, Upload, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react'

type Risk = 'low' | 'medium' | 'high'

interface CheckResult {
  verdict: 'likely_scam' | 'likely_breach_notice' | 'likely_safe_or_unknown'
  scamRisk: Risk
  breachRisk: Risk
  confidence: number
  reasons: string[]
  actionItems: string[]
  extractedSignals?: { scamSignals?: string[]; breachSignals?: string[] }
  source?: string
}

declare global {
  interface Window {
    Tesseract?: {
      recognize: (image: string, lang: string, opts?: any) => Promise<{ data?: { text?: string } }>
    }
  }
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

let tesseractLoadPromise: Promise<void> | null = null

function loadTesseractScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no-window'))
  if (window.Tesseract) return Promise.resolve()
  if (tesseractLoadPromise) return tesseractLoadPromise

  tesseractLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ghostscan-tesseract="1"]') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('tesseract-load-failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
    script.async = true
    script.defer = true
    script.dataset.ghostscanTesseract = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('tesseract-load-failed'))
    document.head.appendChild(script)
  })

  return tesseractLoadPromise
}

export default function ScreenshotChecker() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [hintText, setHintText] = useState('')
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrText, setOcrText] = useState('')
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CheckResult | null>(null)

  const badge = useMemo(() => {
    if (!result) return null
    const isHigh = result.scamRisk === 'high' || result.breachRisk === 'high'
    const isMedium = result.scamRisk === 'medium' || result.breachRisk === 'medium'
    if (isHigh) return { color: 'text-red-500 border-[#f8717133] bg-[#f8717111]', label: 'High Attention' }
    if (isMedium) return { color: 'text-amber-500 border-[#fbbf2433] bg-[#fbbf2411]', label: 'Review Carefully' }
    return { color: 'text-red-500 border-red-500/20 bg-red-500/[0.07]', label: 'Low Risk Signals' }
  }, [result])

  async function onPickFile(selected: File | null) {
    setFile(selected)
    setResult(null)
    setError(null)
    if (!selected) {
      setPreview(null)
      setOcrText('')
      return
    }
    const dataUrl = await toDataUrl(selected)
    setPreview(dataUrl)
    await runLocalOcr(dataUrl)
  }

  async function runLocalOcr(dataUrl: string) {
    setOcrLoading(true)
    setOcrError(null)
    setOcrText('')
    try {
      const detectorCtor = (window as any).TextDetector
      if (detectorCtor) {
        const img = new Image()
        img.src = dataUrl
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('image-load-failed'))
        })

        const detector = new detectorCtor()
        const blocks = await detector.detect(img)
        const text = blocks
          .map((b: any) => b.rawValue?.trim())
          .filter(Boolean)
          .join('\n')
          .slice(0, 10000)

        if (text) {
          setOcrText(text)
          return
        }
      }

      // Fallback OCR path: CDN-loaded Tesseract (works cross-browser, slower)
      await loadTesseractScript()
      if (!window.Tesseract) throw new Error('tesseract-unavailable')

      const recognized = await window.Tesseract.recognize(dataUrl, 'eng')
      const text = (recognized?.data?.text || '').trim().slice(0, 10000)
      if (!text) {
        setOcrError('No readable text found in screenshot.')
        return
      }
      setOcrText(text)
    } catch {
      setOcrError('OCR failed in this browser for this image.')
    } finally {
      setOcrLoading(false)
    }
  }

  async function runCheck() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const imageDataUrl = file ? await toDataUrl(file) : undefined
      const res = await fetch('/api/screenshot-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl,
          hintText: hintText.trim() || undefined,
          extractedText: ocrText || undefined,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Check failed')
      }

      const payload = await res.json()
      setResult(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run screenshot check')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gs-card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text)]">Screenshot Scam / Breach Checker</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Upload a screenshot of an email, message, pop-up, or site. GhostScan flags scam cues and breach-related language.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block text-xs text-[var(--text-muted)] font-mono">Screenshot upload</label>
          <label className="border border-black/[0.06] dark:border-white/[0.06] rounded-lg p-4 bg-[var(--card-bg)] cursor-pointer hover:border-[var(--accent)] transition-colors block">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
            />
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Upload className="w-4 h-4 text-blue-500" />
              {file ? file.name : 'Choose screenshot image'}
            </div>
          </label>

          <label className="block text-xs text-[var(--text-muted)] font-mono">Optional text hint (improves fallback)</label>
          <textarea
            value={hintText}
            onChange={(e) => setHintText(e.target.value)}
            placeholder="Paste suspicious text, sender details, or link text here..."
            className="w-full min-h-[100px] bg-[var(--card-bg)] border border-black/[0.06] dark:border-white/[0.06] rounded-lg p-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
          />

          <button
            onClick={runCheck}
            disabled={loading || (!file && !hintText.trim())}
            className="gs-btn-primary text-sm py-2.5 px-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            {loading ? 'Analyzing...' : 'Analyze Screenshot'}
          </button>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {ocrLoading && <p className="text-xs text-blue-500">Running local OCR...</p>}
          {ocrError && <p className="text-xs text-amber-500">{ocrError}</p>}
          {ocrText && (
            <div className="bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.06] rounded-lg p-2.5">
              <p className="text-xs text-[var(--text-muted)] mb-1 font-mono">OCR extracted text preview</p>
              <pre className="text-[11px] text-[var(--text-muted)] whitespace-pre-wrap max-h-28 overflow-y-auto">{ocrText.slice(0, 800)}</pre>
            </div>
          )}
        </div>

        <div className="border border-black/[0.06] dark:border-white/[0.06] rounded-lg bg-[var(--card-bg)] min-h-[220px] flex items-center justify-center overflow-hidden">
          {preview ? (
            <img src={preview} alt="Screenshot preview" className="max-h-[320px] w-auto object-contain" />
          ) : (
            <div className="text-xs text-[var(--text-muted)] font-mono">No screenshot selected</div>
          )}
        </div>
      </div>

      {result && (
        <div className="border border-black/[0.06] dark:border-white/[0.06] rounded-lg p-4 bg-[var(--card-bg)] space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {(result.scamRisk === 'high' || result.breachRisk === 'high') ? (
                <ShieldAlert className="w-4 h-4 text-red-500" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-semibold text-[var(--text)]">
                Verdict: {result.verdict.replaceAll('_', ' ')}
              </span>
            </div>
            {badge && (
              <span className={`text-xs px-2 py-1 rounded-full border ${badge.color}`}>{badge.label}</span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.06] rounded px-2 py-1.5">
              <span className="text-[var(--text-muted)]">Scam Risk</span>
              <div className="font-mono mt-0.5 uppercase text-[var(--text)]">{result.scamRisk}</div>
            </div>
            <div className="bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.06] rounded px-2 py-1.5">
              <span className="text-[var(--text-muted)]">Breach Risk</span>
              <div className="font-mono mt-0.5 uppercase text-[var(--text)]">{result.breachRisk}</div>
            </div>
            <div className="bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.06] rounded px-2 py-1.5">
              <span className="text-[var(--text-muted)]">Confidence</span>
              <div className="font-mono mt-0.5 text-[var(--text)]">{Math.round((result.confidence || 0) * 100)}%</div>
            </div>
            <div className="bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.06] rounded px-2 py-1.5">
              <span className="text-[var(--text-muted)]">Analysis Source</span>
              <div className="font-mono mt-0.5 text-[var(--text)]">{result.source || 'unknown'}</div>
            </div>
          </div>

          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Why flagged</p>
            <ul className="text-sm text-[var(--text-muted)] space-y-1">
              {result.reasons?.map((r, i) => <li key={`${r}-${i}`}>• {r}</li>)}
            </ul>
          </div>

          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Recommended actions</p>
            <ul className="text-sm text-[var(--text-muted)] space-y-1">
              {result.actionItems?.map((a, i) => <li key={`${a}-${i}`}>• {a}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
