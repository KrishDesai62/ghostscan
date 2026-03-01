import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const Schema = z.object({ email: z.string().email() });

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
  let body;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase OTP is not configured on server.' }, { status: 503 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    req.headers.get('origin') ||
    'http://localhost:3000';

  const { error } = await supabase.auth.signInWithOtp({
    email: body.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${appUrl}/verify?email=${encodeURIComponent(body.email)}`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
