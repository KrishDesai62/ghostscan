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
    if (isHigh) return { color: 'text-[#ff3b5c] border-[#ff3b5c33] bg-[#ff3b5c11]', label: 'High Attention' }
    if (isMedium) return { color: 'text-[#ffd166] border-[#ffd16633] bg-[#ffd16611]', label: 'Review Carefully' }
    return { color: 'text-[#00ff9d] border-[#00ff9d33] bg-[#00ff9d11]', label: 'Low Risk Signals' }
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
        <h3 className="text-sm font-semibold text-gray-200">Screenshot Scam / Breach Checker</h3>
        <p className="text-xs text-gray-500 mt-1">
          Upload a screenshot of an email, message, pop-up, or site. GhostScan flags scam cues and breach-related language.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block text-xs text-gray-500 font-mono">Screenshot upload</label>
          <label className="border border-[#1e2d45] rounded-lg p-4 bg-[#0a111d] cursor-pointer hover:border-[#2f466a] transition-colors block">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
            />
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Upload className="w-4 h-4 text-[#4cc9f0]" />
              {file ? file.name : 'Choose screenshot image'}
            </div>
          </label>

          <label className="block text-xs text-gray-500 font-mono">Optional text hint (improves fallback)</label>
          <textarea
            value={hintText}
            onChange={(e) => setHintText(e.target.value)}
            placeholder="Paste suspicious text, sender details, or link text here..."
            className="w-full min-h-[100px] bg-[#0a111d] border border-[#1e2d45] rounded-lg p-3 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-[#3a567f]"
          />

          <button
            onClick={runCheck}
            disabled={loading || (!file && !hintText.trim())}
            className="gs-btn-primary text-sm py-2.5 px-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            {loading ? 'Analyzing...' : 'Analyze Screenshot'}
          </button>

          {error && <p className="text-xs text-[#ff3b5c]">{error}</p>}
          {ocrLoading && <p className="text-xs text-[#4cc9f0]">Running local OCR...</p>}
          {ocrError && <p className="text-xs text-[#ffd166]">{ocrError}</p>}
          {ocrText && (
            <div className="bg-[#080f1a] border border-[#1e2d45] rounded-lg p-2.5">
              <p className="text-xs text-gray-500 mb-1 font-mono">OCR extracted text preview</p>
              <pre className="text-[11px] text-gray-300 whitespace-pre-wrap max-h-28 overflow-y-auto">{ocrText.slice(0, 800)}</pre>
            </div>
          )}
        </div>

        <div className="border border-[#1e2d45] rounded-lg bg-[#0a111d] min-h-[220px] flex items-center justify-center overflow-hidden">
          {preview ? (
            <img src={preview} alt="Screenshot preview" className="max-h-[320px] w-auto object-contain" />
          ) : (
            <div className="text-xs text-gray-600 font-mono">No screenshot selected</div>
          )}
        </div>
      </div>

      {result && (
        <div className="border border-[#1e2d45] rounded-lg p-4 bg-[#0a111d] space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {(result.scamRisk === 'high' || result.breachRisk === 'high') ? (
                <ShieldAlert className="w-4 h-4 text-[#ff3b5c]" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-[#00ff9d]" />
              )}
              <span className="text-sm font-semibold text-gray-100">
                Verdict: {result.verdict.replaceAll('_', ' ')}
              </span>
            </div>
            {badge && (
              <span className={`text-xs px-2 py-1 rounded-full border ${badge.color}`}>{badge.label}</span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-[#080f1a] border border-[#1e2d45] rounded px-2 py-1.5">
              <span className="text-gray-500">Scam Risk</span>
              <div className="font-mono mt-0.5 uppercase text-gray-200">{result.scamRisk}</div>
            </div>
            <div className="bg-[#080f1a] border border-[#1e2d45] rounded px-2 py-1.5">
              <span className="text-gray-500">Breach Risk</span>
              <div className="font-mono mt-0.5 uppercase text-gray-200">{result.breachRisk}</div>
            </div>
            <div className="bg-[#080f1a] border border-[#1e2d45] rounded px-2 py-1.5">
              <span className="text-gray-500">Confidence</span>
              <div className="font-mono mt-0.5 text-gray-200">{Math.round((result.confidence || 0) * 100)}%</div>
            </div>
            <div className="bg-[#080f1a] border border-[#1e2d45] rounded px-2 py-1.5">
              <span className="text-gray-500">Analysis Source</span>
              <div className="font-mono mt-0.5 text-gray-200">{result.source || 'unknown'}</div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Why flagged</p>
            <ul className="text-sm text-gray-300 space-y-1">
              {result.reasons?.map((r, i) => <li key={`${r}-${i}`}>• {r}</li>)}
            </ul>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Recommended actions</p>
            <ul className="text-sm text-gray-300 space-y-1">
              {result.actionItems?.map((a, i) => <li key={`${a}-${i}`}>• {a}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
