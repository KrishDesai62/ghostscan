'use client'
import { useState } from 'react'
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, ShieldAlert } from 'lucide-react'

interface PasswordCheckResult {
  breached: boolean
  breachCount: number
  risk: 'low' | 'elevated' | 'medium' | 'high'
  note: string
}

export default function PasswordBreachChecker() {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PasswordCheckResult | null>(null)

  async function runCheck() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/password-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Password check failed')
      }
      const payload = await res.json()
      setResult(payload)
      setPassword('')
      setShow(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password check failed')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = password.length >= 6 && !loading

  return (
    <div className="gs-card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-200">Password Breach Detector</h3>
        <p className="text-xs text-gray-500 mt-1">
          Checks if a password has appeared in known breach datasets using HIBP Pwned Passwords.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-gray-500 font-mono">Password to test</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#0a111d] border border-[#1e2d45] rounded-lg px-3 py-2.5">
            <KeyRound className="w-4 h-4 text-[#4cc9f0]" />
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to check"
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="gs-btn-ghost text-xs py-2.5 px-3"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <button
        onClick={runCheck}
        disabled={!canSubmit}
        className="gs-btn-primary text-sm py-2.5 px-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
        {loading ? 'Checking...' : 'Check Password Breach'}
      </button>

      {error && <p className="text-xs text-[#ff3b5c]">{error}</p>}

      {result && (
        <div className="border border-[#1e2d45] rounded-lg p-4 bg-[#0a111d] space-y-3">
          <div className="flex items-center gap-2">
            {result.breached ? (
              <AlertTriangle className="w-4 h-4 text-[#ff3b5c]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#00ff9d]" />
            )}
            <span className="text-sm font-semibold text-gray-100">
              {result.breached ? 'Password appears in breach datasets' : 'No match found in known breach datasets'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="bg-[#080f1a] border border-[#1e2d45] rounded px-2 py-1.5">
              <span className="text-gray-500">Risk</span>
              <div className="font-mono mt-0.5 uppercase text-gray-200">{result.risk}</div>
            </div>
            <div className="bg-[#080f1a] border border-[#1e2d45] rounded px-2 py-1.5">
              <span className="text-gray-500">Breach Count</span>
              <div className="font-mono mt-0.5 text-gray-200">{result.breachCount.toLocaleString()}</div>
            </div>
          </div>

          <p className="text-xs text-gray-500">{result.note}</p>
        </div>
      )}
    </div>
  )
}
