// src/app/api/deletion-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const CreateSchema = z.object({
  scanId:       z.string().uuid().optional(),
  targetId:     z.string(),
  targetName:   z.string(),
  targetEmail:  z.string().email().optional(),
  targetUrl:    z.string().url().optional(),
  targetType:   z.enum(['broker','breach','other']),
  regime:       z.enum(['gdpr','ccpa','us_state_delete','breach_erasure']),
  refId:        z.string().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const scanId = url.searchParams.get('scanId');

  let query = supabase
    .from('deletion_requests')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (scanId) query = query.eq('scan_id', scanId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });

  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = CreateSchema.parse(await req.json()); }
  catch (err) { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  const { data, error } = await supabase
    .from('deletion_requests')
    .upsert({
      user_id:      session.user.id,
      scan_id:      body.scanId ?? null,
      target_id:    body.targetId,
      target_name:  body.targetName,
      target_email: body.targetEmail ?? null,
      target_url:   body.targetUrl ?? null,
      target_type:  body.targetType,
      regime:       body.regime,
      ref_id:       body.refId ?? null,
      status:       'queued',
    }, {
      onConflict: 'user_id,target_id',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  return NextResponse.json({ request: data });
}
