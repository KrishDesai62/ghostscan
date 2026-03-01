'use client'
import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, MessageCircle, Send, X, Loader2 } from 'lucide-react'

type ChatRole = 'user' | 'assistant'
interface ChatMessage {
  role: ChatRole
  content: string
}

const STARTER: ChatMessage = {
  role: 'assistant',
  content: 'I can help explain your report, risks, and next steps. Ask anything.',
}

function readPageContext(pathname: string) {
  if (typeof window === 'undefined') return { path: pathname, page: 'unknown' }

  const raw = sessionStorage.getItem('ghostscan_result')
  const email = sessionStorage.getItem('ghostscan_email') || undefined
  let result: any = null
  try {
    result = raw ? JSON.parse(raw) : null
  } catch {
    result = null
  }

  const page =
    pathname === '/dashboard'
      ? 'dashboard'
      : pathname === '/checker'
        ? 'screenshot_checker'
        : pathname === '/password-checker'
          ? 'password_checker'
          : pathname === '/report'
            ? 'summary_report'
            : 'app_page'

  return {
    page,
    path: pathname,
    email,
    scanSummary: result
      ? {
          score: result?.scoreBundle?.finalScore,
          level: result?.scoreBundle?.level,
          breaches: result?.breaches?.length,
          trend: result?.trend,
          velocity: result?.velocity,
          momentum: result?.analytics?.momentumScore,
        }
      : undefined,
  }
}

export default function GeminiChatWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER])

  const enabled = useMemo(() => {
    if (typeof window === 'undefined') return false
    return Boolean(sessionStorage.getItem('ghostscan_email'))
  }, [])

  if (!enabled) return null

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending) return

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.slice(-12),
          context: readPageContext(pathname),
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        const err = payload?.error || 'Chat failed'
        const status = payload?.status ? ` (${payload.status})` : ''
        const details = Array.isArray(payload?.details) && payload.details.length
          ? `\nDetails: ${payload.details.join(' | ')}`
          : ''
        setMessages((m) => [...m, { role: 'assistant', content: `I hit an error: ${err}${status}${details}` }])
        return
      }
      const payload = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: payload.reply || 'No response.' }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'I could not reach Gemini right now. Please retry.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[70] bg-[#1e3a5f] hover:bg-[#274971] text-white rounded-full p-3 shadow-[0_10px_20px_rgba(30,58,95,0.35)] border border-[#355c7d]"
          aria-label="Open GhostScan chat"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-[70] w-[92vw] max-w-sm h-[62vh] max-h-[540px] bg-[#f8f4ec] border border-[#d7d2c8] rounded-xl shadow-[0_20px_40px_rgba(31,41,55,0.20)] flex flex-col overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-[#d7d2c8] bg-[#f2ece0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#1e3a5f]" />
              <div>
                <div className="text-sm font-semibold text-[#1f2937]">GhostScan Assistant</div>
                <div className="text-[11px] text-[#6b7280] font-mono">{pathname}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-[#6b7280] hover:text-[#1f2937] p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`max-w-[90%] text-sm leading-[1.45] px-3 py-2 rounded-lg ${
                  m.role === 'user'
                    ? 'ml-auto bg-[#355c7d] text-white rounded-br-sm'
                    : 'bg-white border border-[#e2ddd3] text-[#1f2937] rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="bg-white border border-[#e2ddd3] text-[#1f2937] rounded-lg rounded-bl-sm px-3 py-2 text-sm inline-flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking...
              </div>
            )}
          </div>

          <div className="p-2.5 border-t border-[#d7d2c8] bg-[#f2ece0]">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void sendMessage()
                  }
                }}
                placeholder="Ask about your exposure, trends, or mitigations..."
                className="flex-1 bg-white border border-[#d7d2c8] rounded-md px-3 py-2 text-sm text-[#1f2937] placeholder:text-[#9ca3af] outline-none focus:border-[#355c7d]"
              />
              <button
                onClick={() => void sendMessage()}
                disabled={sending || !input.trim()}
                className="bg-[#1e3a5f] hover:bg-[#274971] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md px-2.5 py-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
