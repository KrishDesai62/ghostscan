import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(20000),
})

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
  context: z
    .object({
      page: z.string().nullish(),
      path: z.string().nullish(),
      email: z.string().nullish(),
      scanSummary: z
        .object({
          score: z.number().nullish(),
          level: z.string().nullish(),
          breaches: z.number().nullish(),
          trend: z.string().nullish(),
          velocity: z.union([z.string(), z.number()]).nullish(),
          momentum: z.number().nullish(),
        })
        .nullish(),
    })
    .nullish(),
})

function buildPrompt(context?: z.infer<typeof BodySchema>['context']): string {
  const ctx = context
    ? JSON.stringify(context, null, 2)
    : '{}'
  return [
    'You are GhostScan Assistant, an in-product cybersecurity/privacy helper.',
    'Use the provided page and scan context to personalize responses.',
    'Be concise, practical, and non-alarmist.',
    'If user asks legal or security actions, suggest clear next steps.',
    'If a value is missing in context, say so briefly instead of guessing.',
    'Never claim you performed actions that were not requested.',
    '',
    `Context JSON:\n${ctx}`,
  ].join('\n')
}

const PREFERRED_MODEL_SUFFIXES = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash',
]

function normalizeModelId(name: string): string {
  return name.replace(/^models\//, '')
}

async function pickAvailableModel(apiKey: string): Promise<string> {
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': apiKey },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('list-models-failed')
    const payload = await res.json()
    const models: Array<{ name?: string; supportedGenerationMethods?: string[] }> = payload?.models || []

    const usable = models.filter((m) =>
      (m?.supportedGenerationMethods || []).includes('generateContent') &&
      Boolean(m?.name)
    )
    if (!usable.length) return 'gemini-2.0-flash'

    for (const suffix of PREFERRED_MODEL_SUFFIXES) {
      const found = usable.find((m) => m.name?.endsWith(`/${suffix}`) || m.name?.endsWith(suffix))
      if (found?.name) return normalizeModelId(found.name)
    }

    return normalizeModelId(usable[0].name as string)
  } catch {
    // Safe fallback if model listing fails.
    return 'gemini-2.0-flash'
  }
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: err.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`),
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini unavailable: GEMINI_API_KEY not configured' }, { status: 503 })
  }

  const initialModel = await pickAvailableModel(apiKey)

  const contents = body.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  try {
    const requestModel = async (modelId: string) => {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          // REST-safe field casing for Gemini API
          system_instruction: {
            parts: [{ text: buildPrompt(body.context) }],
          },
          contents,
          generation_config: {
            temperature: 0.3,
            maxOutputTokens: 700,
          },
        }),
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => null)
      return { response, payload, modelId }
    }

    let attempted: string[] = []
    let activeModel = initialModel
    let result = await requestModel(activeModel)
    attempted.push(activeModel)

    if (!result.response.ok && result.payload?.error?.status === 'NOT_FOUND') {
      const candidates = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash']
      for (const candidate of candidates) {
        if (attempted.includes(candidate)) continue
        result = await requestModel(candidate)
        attempted.push(candidate)
        activeModel = candidate
        if (result.response.ok) break
        if (result.payload?.error?.status !== 'NOT_FOUND') break
      }
    }

    if (!result.response.ok) {
      const msg = result.payload?.error?.message || `Gemini request failed (${result.response.status})`
      return NextResponse.json(
        {
          error: msg,
          status: result.payload?.error?.status,
          details: result.payload?.error?.details || null,
          attemptedModels: attempted,
        },
        { status: 502 }
      )
    }

    const text =
      result.payload?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text)
        .filter(Boolean)
        .join('\n')
        .trim() || ''

    if (!text) {
      return NextResponse.json({ error: 'Gemini returned empty response' }, { status: 502 })
    }

    return NextResponse.json({ reply: text, model: activeModel, attemptedModels: attempted })
  } catch {
    return NextResponse.json({ error: 'Gemini request failed' }, { status: 502 })
  }
}
