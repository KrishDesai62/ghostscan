'use client'
import { useEffect, useRef, useState } from 'react'

interface Node { id: string; label: string; type: 'email' | 'breach' | 'data_class'; color?: string }
interface Edge { source: string; target: string; label?: string }
interface Props { graphData: { nodes: Node[]; edges: Edge[] } }

const NODE_COLORS = { email: '#3b82f6', breach: '#f87171', data_class: '#60a5fa' }
const NODE_RADIUS = { email: 24, breach: 18, data_class: 12 }

export default function AttackGraph({ graphData }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !graphData) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = 360

    const nodes = graphData.nodes.slice(0, 20)
    const edges = graphData.edges.slice(0, 30)

    const emailNode = nodes.find(n => n.type === 'email')
    const breachNodes = nodes.filter(n => n.type === 'breach')
    const dataNodes   = nodes.filter(n => n.type === 'data_class').slice(0, 10)

    const positions: Record<string, { x: number; y: number }> = {}
    const cx = W / 2, cy = H / 2

    if (emailNode) positions[emailNode.id] = { x: cx, y: cy }

    const bAngle = (2 * Math.PI) / Math.max(breachNodes.length, 1)
    breachNodes.forEach((n, i) => {
      positions[n.id] = { x: cx + Math.cos(bAngle * i) * 140, y: cy + Math.sin(bAngle * i) * 100 }
    })

    const dAngle = (2 * Math.PI) / Math.max(dataNodes.length, 1)
    dataNodes.forEach((n, i) => {
      positions[n.id] = { x: cx + Math.cos(dAngle * i + 0.4) * 230, y: cy + Math.sin(dAngle * i + 0.4) * 150 }
    })

    const bgColor = isDark ? '#0a0a0a' : '#faf9f7'
    const labelColor = isDark ? '#d1d5db' : '#374151'

    function draw() {
      ctx!.clearRect(0, 0, W, H)

      ctx!.fillStyle = bgColor
      ctx!.fillRect(0, 0, W, H)

      edges.forEach(e => {
        const s = positions[e.source]
        const t = positions[e.target]
        if (!s || !t) return
        ctx!.beginPath()
        ctx!.moveTo(s.x, s.y)
        ctx!.lineTo(t.x, t.y)
        ctx!.strokeStyle = e.label === 'Leaked In' ? '#f8717144' : '#60a5fa44'
        ctx!.lineWidth = 1
        ctx!.stroke()
      })

      nodes.forEach(n => {
        const pos = positions[n.id]
        if (!pos) return
        const r = NODE_RADIUS[n.type] || 12
        const color = NODE_COLORS[n.type] || '#fff'

        const grad = ctx!.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 2)
        grad.addColorStop(0, `${color}44`)
        grad.addColorStop(1, `${color}00`)
        ctx!.beginPath()
        ctx!.arc(pos.x, pos.y, r * 2, 0, Math.PI * 2)
        ctx!.fillStyle = grad
        ctx!.fill()

        ctx!.beginPath()
        ctx!.arc(pos.x, pos.y, r, 0, Math.PI * 2)
        ctx!.fillStyle = `${color}22`
        ctx!.fill()
        ctx!.strokeStyle = color
        ctx!.lineWidth = 1.5
        ctx!.stroke()

        ctx!.fillStyle = n.type === 'email' ? '#3b82f6' : labelColor
        ctx!.font = `${n.type === 'email' ? 700 : 400} ${n.type === 'data_class' ? 9 : 11}px 'Space Mono', monospace`
        ctx!.textAlign = 'center'
        ctx!.textBaseline = 'middle'
        const maxW = n.label.length > 12 ? n.label.slice(0, 12) + '…' : n.label
        ctx!.fillText(n.type === 'email' ? 'YOU' : maxW, pos.x, pos.y + r + 14)
      })
    }

    draw()
  }, [graphData, isDark])

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-3 text-xs font-mono">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Your Email</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Breached Service</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />Data Class</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
        style={{ height: 360 }}
      />
    </div>
  )
}
