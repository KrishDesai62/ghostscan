import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { z } from 'zod'

const Schema = z.object({
  password: z.string().min(1).max(256),
})

function sha1Upper(input: string): string {
  return createHash('sha1').update(input, 'utf8').digest('hex').toUpperCase()
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Schema>
  try {
    body = Schema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const hash = sha1Upper(body.password)
  const prefix = hash.slice(0, 5)
  const suffix = hash.slice(5)
  const apiKey = process.env.HIBP_API_KEY

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true',
        'User-Agent': 'GhostScan-HackathonMVP/1.0',
        ...(apiKey ? { 'hibp-api-key': apiKey } : {}),
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Password check failed (${res.status})` }, { status: 502 })
    }

    const text = await res.text()
    const lines = text.split('\n')

    let breachCount = 0
    for (const line of lines) {
      const [hashSuffixRaw, countRaw] = line.trim().split(':')
      if (!hashSuffixRaw || !countRaw) continue
      if (hashSuffixRaw.toUpperCase() === suffix) {
        breachCount = Number.parseInt(countRaw, 10) || 0
        break
      }
    }

    const breached = breachCount > 0
    const risk = breached
      ? breachCount > 100000
        ? 'high'
        : breachCount > 1000
          ? 'medium'
          : 'elevated'
      : 'low'

    return NextResponse.json({
      breached,
      breachCount,
      risk,
      usedApiKey: Boolean(apiKey),
      note: 'Only first 5 chars of SHA-1 hash are sent to HIBP; raw password is never transmitted.',
    })
  } catch {
    return NextResponse.json({ error: 'Unable to check password right now' }, { status: 502 })
  }
}
