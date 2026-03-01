'use client'
import { useEffect, useRef } from 'react'

interface Node { id: string; label: string; type: 'email' | 'breach' | 'data_class'; color?: string }
interface Edge { source: string; target: string; label?: string }
interface Props { graphData: { nodes: Node[]; edges: Edge[] } }

/* original node palette in shared graph: email #00ff9d, breach #ff3b5c, data_class #4cc9f0 */
const NODE_COLORS = { email: '#355c7d', breach: '#7b4f2c', data_class: '#6c8a64' }
const NODE_RADIUS = { email: 24, breach: 18, data_class: 12 }

export default function ReportAttackGraph({ graphData }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !graphData) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = (canvas.width = canvas.offsetWidth)
    const H = (canvas.height = 360)

    const nodes = graphData.nodes.slice(0, 20)
    const edges = graphData.edges.slice(0, 30)

    const emailNode = nodes.find((n) => n.type === 'email')
    const breachNodes = nodes.filter((n) => n.type === 'breach')
    const dataNodes = nodes.filter((n) => n.type === 'data_class').slice(0, 10)

    const positions: Record<string, { x: number; y: number }> = {}
    const cx = W / 2
    const cy = H / 2

    if (emailNode) positions[emailNode.id] = { x: cx, y: cy }

    const bAngle = (2 * Math.PI) / Math.max(breachNodes.length, 1)
    breachNodes.forEach((n, i) => {
      positions[n.id] = { x: cx + Math.cos(bAngle * i) * 140, y: cy + Math.sin(bAngle * i) * 100 }
    })

    const dAngle = (2 * Math.PI) / Math.max(dataNodes.length, 1)
    dataNodes.forEach((n, i) => {
      positions[n.id] = { x: cx + Math.cos(dAngle * i + 0.4) * 230, y: cy + Math.sin(dAngle * i + 0.4) * 150 }
    })

    function draw() {
      const c = ctx as CanvasRenderingContext2D
      c.clearRect(0, 0, W, H)

      /* original background fill from shared graph: #0e1421 */
      c.fillStyle = '#f7f2e8'
      c.fillRect(0, 0, W, H)

      edges.forEach((e) => {
        const s = positions[e.source]
        const t = positions[e.target]
        if (!s || !t) return
        c.beginPath()
        c.moveTo(s.x, s.y)
        c.lineTo(t.x, t.y)
        /* original edge colors: #ff3b5c44 and #4cc9f044 */
        c.strokeStyle = e.label === 'Leaked In' ? '#7b4f2c55' : '#6c8a6455'
        c.lineWidth = 1
        c.stroke()
      })

      nodes.forEach((n) => {
        const pos = positions[n.id]
        if (!pos) return
        const r = NODE_RADIUS[n.type] || 12
        const color = NODE_COLORS[n.type] || '#374151'

        const grad = c.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 2)
        grad.addColorStop(0, `${color}33`)
        grad.addColorStop(1, `${color}00`)
        c.beginPath()
        c.arc(pos.x, pos.y, r * 2, 0, Math.PI * 2)
        c.fillStyle = grad
        c.fill()

        c.beginPath()
        c.arc(pos.x, pos.y, r, 0, Math.PI * 2)
        c.fillStyle = `${color}22`
        c.fill()
        c.strokeStyle = color
        c.lineWidth = 1.2
        c.stroke()

        /* original email label color: #00ff9d, others #ffffff99 */
        c.fillStyle = n.type === 'email' ? '#355c7d' : '#4b5563'
        c.font = `${n.type === 'email' ? 700 : 500} ${n.type === 'data_class' ? 9 : 11}px ui-monospace, SFMono-Regular, Menlo, monospace`
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        const maxW = n.label.length > 12 ? `${n.label.slice(0, 12)}…` : n.label
        c.fillText(n.type === 'email' ? 'YOU' : maxW, pos.x, pos.y + r + 14)
      })
    }

    draw()
  }, [graphData])

  return (
    <div className="relative">
      <div className="flex items-center gap-5 mb-3 text-xs font-mono text-[#4b5563]">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#355c7d] inline-block" />Your Email</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7b4f2c] inline-block" />Breached Service</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#6c8a64] inline-block" />Data Class</span>
      </div>
      {/* original class from shared graph canvas: rounded-lg */}
      <canvas ref={canvasRef} className="w-full rounded-sm border border-[#d7d2c8]" style={{ height: 360 }} />
    </div>
  )
}
