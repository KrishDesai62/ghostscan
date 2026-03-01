import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const Schema = z.object({
  imageDataUrl: z.string().optional(),
  hintText: z.string().max(4000).optional(),
  extractedText: z.string().max(12000).optional(),
});

type Risk = 'low' | 'medium' | 'high';

function parseModelJson(text: string): any | null {
  const cleaned = text.trim();
  try {
    return JSON.parse(cleaned);
  } catch {}

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function rulesFromText(inputText?: string, sourceOverride?: string) {
  const txt = (inputText || '').toLowerCase();
  const scamSignals = ['urgent', 'verify now', 'suspended', 'click here', 'gift card', 'crypto', 'wire transfer', 'otp', 'password'];
  const breachSignals = ['data breach', 'compromised', 'leaked', 'exposed', 'security incident', 'pwned'];

  const scamHits = scamSignals.filter((s) => txt.includes(s));
  const breachHits = breachSignals.filter((s) => txt.includes(s));

  let scamRisk: Risk = 'low';
  let breachRisk: Risk = 'low';

  if (scamHits.length >= 3) scamRisk = 'high';
  else if (scamHits.length >= 1) scamRisk = 'medium';

  if (breachHits.length >= 2) breachRisk = 'high';
  else if (breachHits.length >= 1) breachRisk = 'medium';

  const verdict = scamRisk === 'high'
    ? 'likely_scam'
    : breachRisk === 'high'
      ? 'likely_breach_notice'
      : 'likely_safe_or_unknown';

  return {
    verdict,
    scamRisk,
    breachRisk,
    confidence: inputText ? 0.55 : 0.25,
    reasons: [
      scamHits.length > 0 ? `Detected scam-like terms: ${scamHits.join(', ')}` : 'No strong scam terms detected.',
      breachHits.length > 0 ? `Detected breach terms: ${breachHits.join(', ')}` : 'No strong breach terms detected.',
    ],
    actionItems: [
      'Do not click links in suspicious messages.',
      'Verify from the official website directly.',
      'Rotate password and enable 2FA if account risk is possible.',
    ],
    extractedSignals: {
      scamSignals: scamHits,
      breachSignals: breachHits,
    },
    source: sourceOverride || 'heuristic_fallback',
  };
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const combinedText = [body.hintText, body.extractedText].filter(Boolean).join('\n');
  const fallbackSource = body.extractedText ? 'ocr_rules' : 'heuristic_fallback';
  if (!apiKey) {
    return NextResponse.json(rulesFromText(combinedText, fallbackSource));
  }

  try {
    const userContent: Array<any> = [
      {
        type: 'text',
        text: [
          'Analyze this screenshot for scam risk and data-breach relevance.',
          'Return strict JSON with keys:',
          '{"verdict":"likely_scam|likely_breach_notice|likely_safe_or_unknown","scamRisk":"low|medium|high","breachRisk":"low|medium|high","confidence":0.0,"reasons":["..."],"actionItems":["..."],"extractedSignals":{"scamSignals":["..."],"breachSignals":["..."]}}',
          'Keep reasons/actionItems concise (max 4 each).',
          body.hintText ? `Hint text from user: ${body.hintText}` : 'No hint text provided.',
          body.extractedText ? `OCR extracted text: ${body.extractedText}` : 'No OCR text provided.',
        ].join('\n'),
      },
    ];

    if (body.imageDataUrl) {
      userContent.push({
        type: 'image_url',
        image_url: { url: body.imageDataUrl },
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'You are a security triage assistant. Return only valid JSON with the exact schema requested.',
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(rulesFromText(combinedText, fallbackSource));
    }

    const payload = await response.json();
    const raw = payload?.choices?.[0]?.message?.content || '';
    const parsed = parseModelJson(raw);

    if (!parsed) {
      return NextResponse.json(rulesFromText(combinedText, fallbackSource));
    }

    return NextResponse.json({ ...parsed, source: 'ai_vision' });
  } catch {
    return NextResponse.json(rulesFromText(combinedText, fallbackSource));
  }
}
