// src/app/api/deletion-requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const UpdateSchema = z.object({
  status: z.enum(['pending','queued','sent','awaiting_response','deleted','failed','escalated']),
  notes:  z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = UpdateSchema.parse(await req.json()); }
  catch (err) { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  const updates: Record<string, unknown> = { status: body.status };
  if (body.notes) updates.notes = body.notes;
  if (body.status === 'sent') {
    updates.sent_at = new Date().toISOString();
    // Auto-escalate 30 days from now
    const escalateAt = new Date();
    escalateAt.setDate(escalateAt.getDate() + 30);
    updates.escalate_after = escalateAt.toISOString();
  }
  if (body.status === 'deleted') updates.confirmed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('deletion_requests')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  return NextResponse.json({ request: data });
}
