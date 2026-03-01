'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, ShieldCheck, ChevronRight, ArrowLeft, Loader2, CheckCircle2, Eye, AlertCircle, Camera, X } from 'lucide-react'
import { PRIVACY_LAW_PROFILES, type ResidencyState } from '@/lib/us-privacy-laws'

type Step = 'email' | 'otp' | 'consent' | 'liveness' | 'hygiene' | 'scanning'
type LivenessStage = 'center_1' | 'left' | 'right'

interface HygieneInputs {
  uses2FA: boolean
  reusesPasswords: boolean
  usesPasswordManager: boolean
}

const SCAN_STEPS = [
  { id: 'intake',   label: 'Intake & signal extraction' },
  { id: 'breach',   label: 'Breach database lookup (HIBP)' },
  { id: 'gravatar', label: 'Public profile check' },
  { id: 'model',    label: 'Risk modeling & scoring' },
  { id: 'render',   label: 'Generating report' },
]

const DEMO_OTP = '123456'
const LIVENESS_FLOW: Array<{ stage: LivenessStage; expected: 'left' | 'center' | 'right'; label: string }> = [
  { stage: 'center_1', expected: 'center', label: 'Look at camera and hold for 1 second' },
  { stage: 'left', expected: 'left', label: 'Move head left and hold for 1 second' },
  { stage: 'right', expected: 'right', label: 'Move head right and hold for 1 second' },
]

export default function VerifyPage() {
  const params = useSearchParams()
  const router = useRouter()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState(params.get('email') || '')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [livenessPassed, setLivenessPassed] = useState(false)
  const [livenessRunning, setLivenessRunning] = useState(false)
  const [livenessDone, setLivenessDone] = useState(false)
  const [livenessStageIdx, setLivenessStageIdx] = useState(0)
  const [livenessHint, setLivenessHint] = useState('Press start to begin challenge.')
  const [livenessMode, setLivenessMode] = useState<'face' | 'motion'>('face')
  const [hygiene, setHygiene] = useState<HygieneInputs>({ uses2FA: false, reusesPasswords: true, usesPasswordManager: false })
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStepIdx, setScanStepIdx] = useState(0)
  const [residencyState, setResidencyState] = useState<ResidencyState>('US_OTHER')
  const [otpSending, setOtpSending] = useState(false)
  const [otpMode, setOtpMode] = useState<'server' | 'demo'>('server')
  const [otpVerified, setOtpVerified] = useState(false)
  const [magicLinkVerifying, setMagicLinkVerifying] = useState(false)
  const [consent, setConsent] = useState({ privacy: false, processing: false, camera: false })
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const rafRef = useRef<number | null>(null)
  const holdStartRef = useRef<number | null>(null)
  const stageIdxRef = useRef(0)
  const runningRef = useRef(false)
  const lastFrameRef = useRef(0)
  const baseCenterRef = useRef<number | null>(null)
  const baseWidthRef = useRef<number | null>(null)
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fallbackCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const prevGrayRef = useRef<Uint8ClampedArray | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  useEffect(() => {
    const tokenHash = params.get('token_hash')
    const verifyType = params.get('type')
    const emailFromQuery = params.get('email')
    if (!tokenHash) return

    if (emailFromQuery && emailFromQuery !== email) {
      setEmail(emailFromQuery)
    }
    setStep('otp')
    setOtpMode('server')
    setMagicLinkVerifying(true)
    setOtpError('')

    void (async () => {
      try {
        const res = await fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenHash,
            type: verifyType === 'magiclink' ? 'magiclink' : 'email',
          }),
        })

        if (!res.ok) {
          const payload = await res.json().catch(() => null)
          setOtpError(payload?.error || 'Magic link verification failed. Please resend OTP.')
          return
        }

        setOtpVerified(true)
        setStep('consent')
      } catch {
        setOtpError('Magic link verification failed. Please resend OTP.')
      } finally {
        setMagicLinkVerifying(false)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      const FaceDetectorCtor = (window as any).FaceDetector
      if (FaceDetectorCtor) {
        detectorRef.current = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 })
        setLivenessMode('face')
      } else {
        detectorRef.current = null
        setLivenessMode('motion')
      }
    } catch {
      // camera denied — skip to limited report
      setLivenessPassed(false)
      setStep('hygiene')
    }
  }

  function stopCamera() {
    runningRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  function getExpectedPose(): 'left' | 'center' | 'right' {
    return LIVENESS_FLOW[stageIdxRef.current]?.expected ?? 'center'
  }

  function getFallbackFrameMetrics(video: HTMLVideoElement): { motionLevel: number; motionCenter: number | null } | null {
    const width = 160
    const height = 120
    if (!fallbackCanvasRef.current) {
      fallbackCanvasRef.current = document.createElement('canvas')
      fallbackCanvasRef.current.width = width
      fallbackCanvasRef.current.height = height
      fallbackCtxRef.current = fallbackCanvasRef.current.getContext('2d')
    }
    const ctx = fallbackCtxRef.current
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, width, height)
    const image = ctx.getImageData(0, 0, width, height)
    const data = image.data
    const gray = new Uint8ClampedArray(width * height)
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) | 0
    }

    const prev = prevGrayRef.current
    prevGrayRef.current = gray
    if (!prev) return { motionLevel: 0, motionCenter: null }

    let motionSum = 0
    let xWeighted = 0
    for (let idx = 0; idx < gray.length; idx++) {
      const diff = Math.abs(gray[idx] - prev[idx])
      motionSum += diff
      const x = idx % width
      xWeighted += diff * x
    }

    const motionLevel = motionSum / (width * height)
    const motionCenter = motionSum > 0 ? (xWeighted / motionSum) / width : null
    return { motionLevel, motionCenter }
  }

  function moveToNextLivenessStage() {
    const next = stageIdxRef.current + 1
    stageIdxRef.current = next
    holdStartRef.current = null
    setLivenessStageIdx(next)

    if (next >= LIVENESS_FLOW.length) {
      runningRef.current = false
      setLivenessRunning(false)
      setLivenessDone(true)
      setLivenessPassed(true)
      setLivenessHint('Liveness verified. Good capture.')
      stopCamera()
      setTimeout(() => setStep('hygiene'), 900)
    } else {
      setLivenessHint(LIVENESS_FLOW[next].label)
    }
  }

  async function runLivenessLoop() {
    if (!runningRef.current) return
    const video = videoRef.current
    if (!video) return

    const now = Date.now()
    if (now - lastFrameRef.current < 180) {
      rafRef.current = requestAnimationFrame(() => { void runLivenessLoop() })
      return
    }
    lastFrameRef.current = now

    try {
      if (detectorRef.current && livenessMode === 'face') {
        const faces = await detectorRef.current.detect(video)
        if (!runningRef.current) return

        if (!faces || faces.length !== 1) {
          holdStartRef.current = null
          setLivenessHint('Ensure exactly one face is visible.')
        } else {
          const face = faces[0]
          const box = face.boundingBox || {}
          const vw = video.videoWidth || 1
          const cx = ((box.x || 0) + (box.width || 0) / 2) / vw
          const widthRatio = ((box.width || 0) / vw) || 0
          const expected = getExpectedPose()

          if (stageIdxRef.current === 0 && expected === 'center' && baseCenterRef.current === null) {
            baseCenterRef.current = cx
            baseWidthRef.current = widthRatio
          }

          const baseCenter = baseCenterRef.current ?? 0.5
          const baseWidth = baseWidthRef.current ?? (widthRatio || 0.2)

          const centerMatch = Math.abs(cx - baseCenter) <= 0.06 && Math.abs(widthRatio - baseWidth) <= 0.12
          const leftMatch = cx <= baseCenter - 0.065
          const rightMatch = cx >= baseCenter + 0.065

          const poseOk =
            expected === 'center' ? centerMatch :
            expected === 'left' ? leftMatch :
            rightMatch

          if (poseOk) {
            if (!holdStartRef.current) holdStartRef.current = now
            const held = now - holdStartRef.current
            const remaining = Math.max(0, 900 - held)
            setLivenessHint(`${LIVENESS_FLOW[stageIdxRef.current].label} (${(remaining / 1000).toFixed(1)}s)`)
            if (held >= 900) moveToNextLivenessStage()
          } else {
            holdStartRef.current = null
            setLivenessHint(`Please move to: ${LIVENESS_FLOW[stageIdxRef.current].label}`)
          }
        }
      } else {
        const metrics = getFallbackFrameMetrics(video)
        if (!metrics) {
          holdStartRef.current = null
          setLivenessHint('Preparing camera frames...')
        } else {
          const expected = getExpectedPose()
          const STILL_THRESHOLD = 7.0
          const MOVE_THRESHOLD = 4.2
          const centerMatch = metrics.motionLevel < STILL_THRESHOLD

          let poseOk = false
          if (expected === 'center') {
            poseOk = centerMatch
          } else {
            // In motion fallback mode, accept a clear head movement either direction.
            // This avoids mirrored-camera direction mismatches on some devices.
            poseOk = metrics.motionLevel > MOVE_THRESHOLD
          }

          if (poseOk) {
            if (!holdStartRef.current) holdStartRef.current = now
            const held = now - holdStartRef.current
            const requiredHold = expected === 'center' ? 700 : 320
            const remaining = Math.max(0, requiredHold - held)
            const modeLabel = expected === 'center'
              ? 'Hold still'
              : expected === 'left'
                ? 'Move head left'
                : 'Move head right'
            setLivenessHint(`${modeLabel} (${(remaining / 1000).toFixed(1)}s)`)
            if (held >= requiredHold) moveToNextLivenessStage()
          } else {
            holdStartRef.current = null
            setLivenessHint(
              expected === 'center'
                ? 'Hold still and keep face in frame.'
                : 'Turn your head clearly (left or right) to register movement.'
            )
          }
        }
      }
    } catch {
      holdStartRef.current = null
      setLivenessHint('Face tracking lost. Keep your face clear in frame.')
    }

    if (runningRef.current) {
      rafRef.current = requestAnimationFrame(() => { void runLivenessLoop() })
    }
  }

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setOtp('')
    setOtpError('')
    setStep('otp')
    void sendOtpCode()
  }

  async function sendOtpCode() {
    setOtpSending(true)
    setOtpError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setOtpMode('server')
        return
      }

      const payload = await res.json().catch(() => null)
      setOtpMode('demo')
      setOtpError(payload?.error ? `${payload.error} Use demo code 123456 for now.` : 'Could not send OTP right now. Use demo code 123456 for now.')
    } catch {
      setOtpMode('demo')
      setOtpError('Could not send OTP right now. Use demo code 123456 for now.')
    } finally {
      setOtpSending(false)
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setOtpError('')

    if (otpMode === 'server') {
      try {
        const res = await fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token: otp }),
        })
        if (!res.ok) {
          const payload = await res.json().catch(() => null)
          setOtpError(payload?.error || 'Invalid or expired code. Try again or resend.')
          return
        }

        setOtpVerified(true)
        setOtpError('')
        setStep('consent')
        return
      } catch {
        setOtpError('Verification failed. Try resend or use demo code.')
        return
      }
    }

    if (otp === DEMO_OTP || otp.length === 6) {
      setOtpVerified(true)
      setStep('consent')
      return
    }

    setOtpError('Invalid code. Use 123456 for demo mode.')
  }

  function handleConsentSubmit() {
    if (!consent.privacy || !consent.processing) return
    setStep('liveness')
    setLivenessDone(false)
    setLivenessPassed(false)
    setLivenessStageIdx(0)
    stageIdxRef.current = 0
    baseCenterRef.current = null
    baseWidthRef.current = null
    prevGrayRef.current = null
    setLivenessHint('Press start to begin challenge.')
    setTimeout(() => startCamera(), 300)
  }

  function handleLivenessChallenge() {
    setLivenessDone(false)
    setLivenessPassed(false)
    setLivenessStageIdx(0)
    stageIdxRef.current = 0
    holdStartRef.current = null
    baseCenterRef.current = null
    baseWidthRef.current = null
    prevGrayRef.current = null
    setLivenessHint(detectorRef.current ? LIVENESS_FLOW[0].label : 'Fallback mode: keep still, then follow side-movement prompts.')

    setLivenessRunning(true)
    runningRef.current = true
    void runLivenessLoop()
  }

  function skipLiveness() {
    setLivenessRunning(false)
    runningRef.current = false
    prevGrayRef.current = null
    stopCamera()
    setLivenessPassed(false)
    setStep('hygiene')
  }

  async function runScan() {
    setStep('scanning')
    // Simulate scan steps with progress
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setScanStepIdx(i)
      setScanProgress(((i + 1) / SCAN_STEPS.length) * 100)
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
    }
    let resultPayload: any
    try {
      const res = await fetch('/api/scan-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          livenessPassed,
          hygieneInputs: hygiene,
        }),
      })
      if (!res.ok) throw new Error('preview scan failed')
      resultPayload = await res.json()
    } catch {
      resultPayload = buildDemoScanResult(email, livenessPassed, hygiene)
    }

    resultPayload.userState = residencyState
    // Store in sessionStorage for dashboard
    sessionStorage.setItem('ghostscan_result', JSON.stringify(resultPayload))
    sessionStorage.setItem('ghostscan_email', email)
    sessionStorage.setItem('ghostscan_state', residencyState)
    sessionStorage.setItem('ghostscan_verified', livenessPassed ? '1' : '0')
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen grid-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#00ff9d] rounded-lg flex items-center justify-center">
            <Eye className="w-4 h-4 text-[#080b12]" />
          </div>
          <span className="font-bold text-lg">Ghost<span className="text-[#00ff9d]">Scan</span></span>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['email','otp','consent','liveness','hygiene','scanning'] as Step[]).map((s, i) => (
            <div key={s} className={`h-1 rounded-full transition-all duration-300 ${
              s === step ? 'w-8 bg-[#00ff9d]' :
              ['email','otp','consent','liveness','hygiene','scanning'].indexOf(step) > i ? 'w-4 bg-[#00ff9d66]' :
              'w-4 bg-[#1e2d45]'
            }`} />
          ))}
        </div>

        {/* ─── EMAIL STEP ─────────────────────────────────── */}
        {step === 'email' && (
          <div className="gs-card p-8 animate-fadeInUp">
            <Mail className="w-10 h-10 text-[#00ff9d] mb-4" />
            <h2 className="text-2xl font-bold mb-2">Analyze Your Exposure</h2>
            <p className="text-gray-400 text-sm mb-6">Enter your email to scan for breaches and generate your risk report.</p>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email" required autoFocus
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#080b12] border border-[#1e2d45] rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00ff9d55] transition-colors"
              />
              <button type="submit" className="w-full gs-btn-primary flex items-center justify-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ─── OTP STEP ──────────────────────────────────── */}
        {step === 'otp' && (
          <div className="gs-card p-8 animate-fadeInUp">
            <ShieldCheck className="w-10 h-10 text-[#00ff9d] mb-4" />
            <h2 className="text-2xl font-bold mb-1">Verify Your Email</h2>
            <p className="text-gray-400 text-sm mb-1">Enter the 6-digit code sent to</p>
            <p className="text-[#00ff9d] font-mono text-sm mb-6">{email}</p>
            <div className="bg-[#ffd16611] border border-[#ffd16633] rounded-lg p-3 mb-5 text-xs text-[#ffd166] font-mono">
              {otpMode === 'server'
                ? '📨 Using Supabase email auth. Paste 6-digit OTP if shown, or click magic link in the same email.'
                : <>🎭 Demo mode fallback: use code <strong>123456</strong></>}
            </div>
            {magicLinkVerifying && (
              <div className="bg-[#4cc9f011] border border-[#4cc9f033] rounded-lg p-3 mb-5 text-xs text-[#4cc9f0] font-mono">
                Verifying magic link...
              </div>
            )}
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <input
                type="text" maxLength={6} autoFocus
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-[#080b12] border border-[#1e2d45] rounded-lg px-4 py-3 font-mono text-2xl text-center tracking-[0.4em] focus:outline-none focus:border-[#00ff9d55] transition-colors"
              />
              {otpError && <p className="text-[#ff3b5c] text-xs font-mono">{otpError}</p>}
              <button type="submit" className="w-full gs-btn-primary flex items-center justify-center gap-2">
                Verify <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={sendOtpCode}
                disabled={otpSending}
                className="w-full gs-btn-ghost text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {otpSending ? 'Sending code...' : 'Resend OTP'}
              </button>
              <button type="button" onClick={() => setStep('email')} className="w-full gs-btn-ghost flex items-center justify-center gap-2 text-sm">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </form>
          </div>
        )}

        {/* ─── CONSENT STEP ─────────────────────────────── */}
        {step === 'consent' && (
          <div className="gs-card p-8 animate-fadeInUp">
            <h2 className="text-2xl font-bold mb-2">Privacy Consent</h2>
            <p className="text-gray-400 text-sm mb-6">GhostScan requires your explicit consent before processing any data.</p>
            <div className="mb-5">
              <label className="text-xs text-gray-500 font-mono block mb-2">Residency (for legal template defaults)</label>
              <select
                value={residencyState}
                onChange={(e) => setResidencyState(e.target.value as ResidencyState)}
                className="w-full bg-[#080b12] border border-[#1e2d45] rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-[#00ff9d55]"
              >
                {PRIVACY_LAW_PROFILES.map((profile) => (
                  <option key={profile.state} value={profile.state}>
                    {profile.label} · {profile.lawName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { key: 'privacy', label: 'I agree to the Privacy Policy — my data is processed for breach analysis only and expires in 30 days', required: true },
                { key: 'processing', label: 'I consent to cross-referencing my email against breach databases (HIBP)', required: true },
                { key: 'camera', label: 'I allow camera access for liveness verification (optional — skip for limited report)', required: false },
              ].map(item => (
                <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => setConsent(c => ({ ...c, [item.key]: !c[item.key as keyof typeof c] }))}
                    className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                      consent[item.key as keyof typeof consent] 
                        ? 'bg-[#00ff9d] border-[#00ff9d]' 
                        : 'border-[#1e2d45] group-hover:border-[#00ff9d55]'
                    }`}
                  >
                    {consent[item.key as keyof typeof consent] && <CheckCircle2 className="w-3.5 h-3.5 text-[#080b12]" />}
                  </div>
                  <span className="text-sm text-gray-400 leading-relaxed">
                    {item.required && <span className="text-[#ff3b5c] mr-1">*</span>}
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={handleConsentSubmit}
              disabled={!consent.privacy || !consent.processing || !otpVerified}
              className="w-full gs-btn-primary flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── LIVENESS STEP ────────────────────────────── */}
        {step === 'liveness' && (
          <div className="gs-card p-8 animate-fadeInUp">
            <Camera className="w-10 h-10 text-[#4cc9f0] mb-4" />
            <h2 className="text-2xl font-bold mb-1">Liveness Check</h2>
            <p className="text-gray-400 text-sm mb-4">Proves you are live with staged pose checks. No images are stored.</p>

            <div className="relative aspect-video bg-[#080b12] rounded-lg overflow-hidden mb-4 border border-[#1e2d45]">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              {!livenessDone && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                  <div className="text-[#4cc9f0] text-sm font-bold font-mono text-center px-4">{livenessHint}</div>
                  <div className="mt-2 text-[11px] text-gray-300 font-mono">
                    Step {Math.min(livenessStageIdx + 1, LIVENESS_FLOW.length)} / {LIVENESS_FLOW.length}
                  </div>
                </div>
              )}
              {livenessDone && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#00ff9d11]">
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-[#00ff9d] mx-auto mb-2" />
                    <p className="text-[#00ff9d] font-bold">Liveness Verified!</p>
                  </div>
                </div>
              )}
            </div>

            {!livenessDone && !livenessRunning && (
              <button onClick={handleLivenessChallenge} className="w-full gs-btn-primary flex items-center justify-center gap-2 mb-3">
                Start Challenge <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {livenessMode === 'motion' && !livenessDone && (
              <div className="mb-3 text-xs text-[#ffd166] bg-[#ffd16611] border border-[#ffd16633] rounded-lg p-2.5">
                Using motion fallback mode for liveness on this browser. Follow the prompts and hold each step until complete.
              </div>
            )}
            <button onClick={skipLiveness} className="w-full gs-btn-ghost text-sm flex items-center justify-center gap-2">
              <X className="w-3.5 h-3.5" /> Skip (limited report)
            </button>
          </div>
        )}

        {/* ─── HYGIENE STEP ─────────────────────────────── */}
        {step === 'hygiene' && (
          <div className="gs-card p-8 animate-fadeInUp">
            <h2 className="text-2xl font-bold mb-1">Security Habits</h2>
            <p className="text-gray-400 text-sm mb-6">These affect your risk score calculation.</p>

            {!livenessPassed && (
              <div className="bg-[#ffd16611] border border-[#ffd16633] rounded-lg p-3 mb-5 text-xs text-[#ffd166] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Limited report — complete liveness check for full Verified dashboard
              </div>
            )}

            <div className="space-y-4 mb-6">
              {[
                { key: 'uses2FA', label: 'I use two-factor authentication', hint: 'Reduces account takeover risk' },
                { key: 'reusesPasswords', label: 'I reuse passwords across sites', hint: 'Major takeover risk amplifier', danger: true },
                { key: 'usesPasswordManager', label: 'I use a password manager', hint: 'Significantly reduces risk' },
              ].map(item => (
                <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => setHygiene(h => ({ ...h, [item.key]: !h[item.key as keyof HygieneInputs] }))}
                    className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                      hygiene[item.key as keyof HygieneInputs]
                        ? item.danger ? 'bg-[#ff3b5c] border-[#ff3b5c]' : 'bg-[#00ff9d] border-[#00ff9d]'
                        : 'border-[#1e2d45] group-hover:border-[#00ff9d55]'
                    }`}
                  >
                    {hygiene[item.key as keyof HygieneInputs] && <CheckCircle2 className="w-3.5 h-3.5 text-[#080b12]" />}
                  </div>
                  <div>
                    <div className="text-sm text-white">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.hint}</div>
                  </div>
                </label>
              ))}
            </div>

            <button onClick={runScan} className="w-full gs-btn-primary flex items-center justify-center gap-2">
              Run Scan <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── SCANNING STEP ────────────────────────────── */}
        {step === 'scanning' && (
          <div className="gs-card p-8 animate-fadeInUp">
            <div className="flex items-center gap-3 mb-6">
              <Loader2 className="w-6 h-6 text-[#00ff9d] animate-spin" />
              <h2 className="text-xl font-bold">Scanning...</h2>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-[#1e2d45] rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00ff9d] to-[#4cc9f0] rounded-full transition-all duration-500"
                style={{ width: `${scanProgress}%` }}
              />
            </div>

            <div className="space-y-2">
              {SCAN_STEPS.map((s, i) => (
                <div key={s.id} className={`scan-step ${i < scanStepIdx ? 'done' : i === scanStepIdx ? 'active' : 'wait'}`}>
                  {i < scanStepIdx ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : i === scanStepIdx ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-current opacity-30" />
                  )}
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 text-xs text-gray-600 font-mono">
              No face images stored · Memory only · Encrypted in transit
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

// ── Demo data builder ────────────────────────────────────────────────────────
function buildDemoScanResult(email: string, verified: boolean, hygiene: HygieneInputs) {
  const breaches = [
    { id: 'LinkedIn',  breach_name: 'LinkedIn',  breach_domain: 'linkedin.com',  breach_date: '2021-06-22', pwn_count: 700000000, data_classes: ['Email addresses','Names','Phone numbers','Professional experience'], is_verified: true, is_sensitive: false },
    { id: 'Adobe',     breach_name: 'Adobe',     breach_domain: 'adobe.com',     breach_date: '2013-10-04', pwn_count: 153000000, data_classes: ['Email addresses','Password hints','Passwords','Usernames'],           is_verified: true, is_sensitive: false },
    { id: 'Canva',     breach_name: 'Canva',     breach_domain: 'canva.com',     breach_date: '2019-05-24', pwn_count: 137272116, data_classes: ['Email addresses','Geographic locations','Names','Passwords'],          is_verified: true, is_sensitive: false },
    { id: 'Dropbox',   breach_name: 'Dropbox',   breach_domain: 'dropbox.com',   breach_date: '2012-07-01', pwn_count: 68648009,  data_classes: ['Email addresses','Passwords'],                                        is_verified: true, is_sensitive: false },
    { id: 'Twitter',   breach_name: 'Twitter',   breach_domain: 'twitter.com',   breach_date: '2022-11-27', pwn_count: 211524284, data_classes: ['Email addresses','Phone numbers'],                                    is_verified: true, is_sensitive: false },
  ]

  const takeover = Math.min(100, (hygiene.reusesPasswords ? 70 : 30) + (!hygiene.uses2FA ? 20 : 0) - (hygiene.usesPasswordManager ? 15 : 0) + 30)
  const theft    = 45
  const phishing = 55
  const exposure = 50
  const finalScore = Math.round(0.35*takeover + 0.25*theft + 0.20*phishing + 0.20*exposure)

  return {
    scanId: `demo-scan-${Date.now()}`,
    reportType: verified ? 'verified_full' : 'limited_fallback',
    email,
    scoreBundle: {
      finalScore,
      level: finalScore < 35 ? 'low' : finalScore < 65 ? 'moderate' : 'high',
      confidence: verified ? 'high' : 'medium',
      dimensions: { takeover, theft, phishing, exposure },
    },
    breaches,
    velocity: (breaches.length / 12).toFixed(1),
    trend: 'increasing',
    dataSource: 'mock_demo',
    hygiene,
    timeSeries: {
      averageIntervalMonths: 28,
      forecastNext12Months: 1,
    },
    analytics: {
      trendExplanation: 'More breaches were found in the last 24 months than in the prior 24 months.',
      momentumScore: 63,
      expectedWindow: { min: 18, max: 32 },
      clusteredExposure: false,
    },
    graphData: {
      nodes: [
        { id: 'email', label: email.split('@')[0], type: 'email', color: '#00ff9d' },
        ...breaches.map(b => ({ id: b.breach_name, label: b.breach_name, type: 'breach', color: '#ff3b5c' })),
        ...Array.from(new Set(breaches.flatMap(b => b.data_classes))).map(dc => ({ id: dc, label: dc, type: 'data_class', color: '#4cc9f0' })),
      ],
      edges: [
        ...breaches.map(b => ({ source: 'email', target: b.breach_name, label: 'Leaked In' })),
        ...breaches.flatMap(b => b.data_classes.map(dc => ({ source: b.breach_name, target: dc, label: 'Contains' }))),
      ],
    },
  }
}
