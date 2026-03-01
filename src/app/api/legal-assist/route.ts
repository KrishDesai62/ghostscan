import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const Schema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  regime: z.enum(['gdpr', 'ccpa', 'us_state_delete', 'breach_erasure']),
});

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI assist unavailable: OPENAI_API_KEY not configured' }, { status: 503 });
  }

  let body;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'You rewrite legal deletion request emails to be concise, respectful, and specific while preserving legal references and factual details. Return only the rewritten body text.',
          },
          {
            role: 'user',
            content: `Regime: ${body.regime}\nSubject: ${body.subject}\n\nRewrite this email body, keep legal references intact:\n\n${body.body}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
    }

    const payload = await response.json();
    const rewritten = payload?.choices?.[0]?.message?.content?.trim();

    if (!rewritten) {
      return NextResponse.json({ error: 'AI returned empty response' }, { status: 502 });
    }

    return NextResponse.json({ body: rewritten });
  } catch {
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
  }
}
