import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const TokenSchema = z.object({
  email: z.string().email(),
  token: z.string().regex(/^\d{6,8}$/),
});

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase OTP is not configured on server.' }, { status: 503 });
  }

  const tokenParsed = TokenSchema.safeParse(rawBody);
  if (!tokenParsed.success) {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }

  const { error } = await supabase.auth.verifyOtp({
    email: tokenParsed.data.email,
    token: tokenParsed.data.token,
    type: 'email',
  });

  if (error) {
    return NextResponse.json({ error: error.message || 'Invalid or expired code' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
