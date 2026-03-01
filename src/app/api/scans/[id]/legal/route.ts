// src/app/api/scans/[id]/legal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateLegalEmail, generateEmlContent, generateMailtoUrl, LegalRegime } from '@/lib/legal-templates';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const regime = (url.searchParams.get('regime') ?? 'gdpr') as LegalRegime;
  const targetId = url.searchParams.get('targetId');
  const targetName = url.searchParams.get('targetName');
  const targetEmail = url.searchParams.get('targetEmail');
  const format = url.searchParams.get('format') ?? 'json'; // json | eml | txt

  const { data: user } = await supabase.from('users').select('email').eq('id', session.user.id).single();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Get scan to ensure ownership
  const { data: scan } = await supabase
    .from('scans')
    .select('*, breaches(*)')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();
  if (!scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 });

  // Find breach data if it's a breach-specific request
  const breach = scan.breaches?.find((b: { breach_name: string }) => b.breach_name === targetName);

  const output = generateLegalEmail({
    userEmail: user.email,
    targetName: targetName ?? 'Data Controller',
    targetEmail: targetEmail ?? 'privacy@example.com',
    regime: breach ? 'breach_erasure' : regime,
    dataClasses: breach?.data_classes,
    breachDate: breach?.breach_date,
  });

  // Log the export
  await supabase.from('legal_exports').insert({
    scan_id:          scan.id,
    regime:           output.regime,
    template_version: '1.0',
    target_name:      targetName,
    target_email:     targetEmail,
  });

  if (format === 'eml') {
    return new NextResponse(generateEmlContent(output), {
      headers: {
        'Content-Type': 'message/rfc822',
        'Content-Disposition': `attachment; filename="${output.filename.replace('.txt', '.eml')}"`,
      },
    });
  }

  if (format === 'txt') {
    return new NextResponse(`To: ${output.to}\nSubject: ${output.subject}\n\n${output.body}`, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${output.filename}"`,
      },
    });
  }

  return NextResponse.json({
    ...output,
    mailtoUrl: generateMailtoUrl(output),
  });
}
