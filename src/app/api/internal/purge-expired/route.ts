// src/app/api/internal/purge-expired/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.PURGE_CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Count breaches that will be cascade-deleted
  const { count: breachCount } = await supabase
    .from('breaches')
    .select('id', { count: 'exact', head: true })
    .in(
      'scan_id',
      (await supabase.from('scans').select('id').lt('expires_at', new Date().toISOString())).data?.map(s => s.id) ?? []
    );

  // Delete expired scans (breaches cascade)
  const { count: scanCount, error } = await supabase
    .from('scans')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('[Purge] Error:', error);
    return NextResponse.json({ error: 'Purge failed' }, { status: 500 });
  }

  // Also auto-escalate overdue deletion requests
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await supabase
    .from('deletion_requests')
    .update({ status: 'escalated' })
    .eq('status', 'sent')
    .lt('escalate_after', new Date().toISOString());

  console.log(`[Purge] Removed ${scanCount} scans, ~${breachCount} breaches`);

  return NextResponse.json({
    purgedScans:    scanCount ?? 0,
    purgedBreaches: breachCount ?? 0,
    timestamp:      new Date().toISOString(),
  });
}
