// src/lib/legal-templates.ts
// Static templates with variable injection
// DISCLAIMER: Informational templates only — not legal advice

export type LegalRegime = 'gdpr' | 'ccpa' | 'us_state_delete' | 'breach_erasure';

export interface LegalEmailContext {
  userEmail: string;
  userName?: string;
  targetName: string;
  targetEmail: string;
  regime: LegalRegime;
  targetType?: 'broker' | 'breach' | 'other';
  requestType?: 'delete' | 'opt_out_sale' | 'combined';
  dataClasses?: string[];
  breachDate?: string;
  refId?: string;
  stateLabel?: string;
  stateLawName?: string;
}

export interface LegalEmailOutput {
  to: string;
  subject: string;
  body: string;
  filename: string;
  refId: string;
  regime: LegalRegime;
}

function genRefId(): string {
  return `GS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function today(): string {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── GDPR Article 17 Erasure ───────────────────────────────────
function gdprErasure(ctx: LegalEmailContext, refId: string): { subject: string; body: string } {
  const isBroker = ctx.targetType === 'broker';
  const subject = isBroker
    ? `Data Broker Erasure & Processing Objection — GDPR Article 17/21 — ${ctx.targetName} — Ref: ${refId}`
    : `Right to Erasure Request — GDPR Article 17 — ${ctx.targetName} — Ref: ${refId}`;
  const brokerSpecificBlock = isBroker
    ? `5. BROKER PROCESSING OBJECTION (Articles 21 and 17)
   I object to your profiling, sale, sharing, and onward transfer of my personal data for broker or marketing purposes. Please cease this processing and suppress future profiling tied to my identifiers.
`
    : '';
  const body = `To the Data Protection Officer at ${ctx.targetName},

Date: ${today()}
Reference Number: ${refId}
Data Subject: ${ctx.userEmail}

═══════════════════════════════════════════════════════
  FORMAL SUBJECT ACCESS & ERASURE REQUEST
  General Data Protection Regulation — Article 15 & 17
═══════════════════════════════════════════════════════

I am writing to formally exercise my rights under the General Data Protection Regulation (EU) 2016/679 (GDPR) and, where applicable, the UK GDPR and Data Protection Act 2018.

I hereby request that ${ctx.targetName} ("the Controller"):

1. ERASURE (Article 17 — Right to Be Forgotten)
   Permanently erase all personal data you hold about me, including:
   • My email address: ${ctx.userEmail}
   ${ctx.userName ? `• My name: ${ctx.userName}` : '• Any name associated with my email address'}
   • Any contact information (phone, address, IP address)
   • Any inferred, derived, or profiled data
   • All records across active databases, archives, and backup systems
   • All data shared with or transferred to third-party processors

2. GROUNDS FOR ERASURE
   I rely on the following grounds under Article 17(1):
   (a) The personal data is no longer necessary for the purposes for which it was collected [Art. 17(1)(a)]
   (b) I withdraw any consent previously given [Art. 17(1)(b)]
   (c) I object to processing under Article 21 [Art. 17(1)(c)]
   (d) I believe my data may have been unlawfully processed [Art. 17(1)(d)]

3. REQUIRED RESPONSE (within 30 days under Article 12(3))
   ☐ Written acknowledgement of this request within 72 hours
   ☐ Confirmation of completed erasure within 30 calendar days
   ☐ Notification to all third-party processors/recipients instructing them to erase my data
   ☐ If any exception under Article 17(3) applies, specify the precise legal basis

4. IDENTITY CONFIRMATION
   I am the owner of the email address ${ctx.userEmail}. If you require additional verification, please specify your preferred process. Note that requiring disproportionate identification is itself a potential GDPR violation.
${brokerSpecificBlock}

If you are unable to honour this request in full, please provide written grounds citing the specific legal basis for any exception claimed.

Failure to respond within 30 days of confirmed receipt may result in a complaint to the relevant supervisory authority (ICO if UK-based; the relevant EU Member State DPA; or the Irish DPC for EU-based controllers).

This letter constitutes a formal legal request and should be treated accordingly and escalated to your Data Protection Officer without delay.

Yours faithfully,

${ctx.userName || '[YOUR FULL NAME]'}
${ctx.userEmail}

─────────────────────────────────────────────────────────
⚠ DISCLAIMER: This is an informational template generated
by GhostScan. It does not constitute legal advice. For
advice specific to your situation, consult a qualified
solicitor or data protection attorney.
Reference: ${refId}
─────────────────────────────────────────────────────────`;
  return { subject, body };
}

// ── CCPA Section 1798.105 Deletion ───────────────────────────
function ccpaDeletion(ctx: LegalEmailContext, refId: string): { subject: string; body: string } {
  const isBroker = ctx.targetType === 'broker';
  const subject = isBroker
    ? `CCPA Data Broker Deletion / Do-Not-Sell Request — Cal. Civ. Code §1798.105 — ${ctx.targetName} — Ref: ${refId}`
    : `CCPA Deletion Request — Cal. Civ. Code §1798.105 — ${ctx.targetName} — Ref: ${refId}`;
  const brokerSpecificBlock = isBroker
    ? `BROKER-SPECIFIC INSTRUCTION:
  • Treat this as both a deletion request and a do-not-sell/share instruction.
  • Remove my listing/profile data from people-search and broker products.
  • Do not re-ingest or republish my personal data after deletion.
`
    : '';
  const body = `To the Privacy Department / Legal Team at ${ctx.targetName},

Date: ${today()}
Reference Number: ${refId}
Consumer Email: ${ctx.userEmail}

═══════════════════════════════════════════════════════
  CALIFORNIA CONSUMER PRIVACY ACT — DELETION REQUEST
  California Civil Code Section 1798.105
  (As amended by CPRA — effective January 1, 2023)
═══════════════════════════════════════════════════════

I am a California resident and am hereby submitting a verified consumer request for deletion of my personal information pursuant to the California Consumer Privacy Act of 2018 (CCPA), as amended by the California Privacy Rights Act (CPRA), California Civil Code Section 1798.105.

CONSUMER IDENTIFYING INFORMATION:
  Email Address: ${ctx.userEmail}
  ${ctx.userName ? `Full Name: ${ctx.userName}` : ''}

REQUEST FOR DELETION:
I request that ${ctx.targetName} and its service providers delete all personal information that has been collected, purchased, or otherwise obtained about me.

This request covers, but is not limited to:
  • Identifiers: name, alias, postal address, email address, IP address, account name
  • Personal records: telephone number, employment history, financial information
  • Commercial information: purchasing history, browsing history, products considered
  • Internet or network activity: browsing history, search history, interaction data
  • Geolocation data
  • Professional or employment-related information
  • Inferences drawn to create a consumer profile

YOUR OBLIGATIONS UNDER CCPA §1798.105(c):
  1. DELETE the consumer's personal information from your records
  2. DIRECT all service providers to delete the consumer's personal information
  3. ACKNOWLEDGE this request within 10 business days (§1798.105(b))
  4. COMPLETE the deletion within 45 calendar days of receipt
     (Extension of up to 45 additional days permitted with written notice)

PLEASE NOTE:
  • I am not required to create an account to submit this request
  • You may not charge a fee for processing this request
  • Deletion must extend to service providers and third parties to whom you have sold my data
  • Under CPRA §1798.121, I also request you do not sell or share my personal information
${brokerSpecificBlock}

If you believe an exception under §1798.105(d) applies, please identify the specific exception in writing.

Non-compliance may result in a complaint to the California Privacy Protection Agency and/or the California Attorney General's office (which may impose civil penalties of $2,500–$7,500 per intentional violation).

Respectfully submitted,

${ctx.userName || '[YOUR FULL NAME]'}
${ctx.userEmail}
[YOUR CALIFORNIA ADDRESS]

─────────────────────────────────────────────────────────
⚠ DISCLAIMER: This is an informational template generated
by GhostScan. It does not constitute legal advice. For
advice specific to your situation, consult a qualified
California privacy attorney.
Reference: ${refId}
─────────────────────────────────────────────────────────`;
  return { subject, body };
}

function usStateDeletion(ctx: LegalEmailContext, refId: string): { subject: string; body: string } {
  const stateLabel = ctx.stateLabel || 'my U.S. state';
  const stateLawName = ctx.stateLawName || 'applicable state privacy law';
  const isBroker = ctx.targetType === 'broker';
  const subject = isBroker
    ? `Data Broker Opt-Out & Deletion Request — ${stateLawName} — ${ctx.targetName} — Ref: ${refId}`
    : `Consumer Data Deletion Request — ${stateLawName} — ${ctx.targetName} — Ref: ${refId}`;
  const brokerSpecificBlock = isBroker
    ? `BROKER-SPECIFIC REQUEST SCOPE:
  • Delete personal information associated with my identifiers
  • Stop selling, sharing, licensing, or disclosing my data
  • Suppress future re-collection for people-search or marketing profiles
`
    : '';
  const body = `To the Privacy Team at ${ctx.targetName},

Date: ${today()}
Reference Number: ${refId}
Consumer Email: ${ctx.userEmail}
State of Residence: ${stateLabel}

═══════════════════════════════════════════════════════
  STATE PRIVACY LAW DELETION REQUEST
  ${stateLawName}
═══════════════════════════════════════════════════════

I am a resident of ${stateLabel} and am exercising my consumer deletion rights under ${stateLawName} and other applicable U.S. privacy law obligations.

I request that ${ctx.targetName} delete personal information associated with my account and identifiers, including:
  • Email: ${ctx.userEmail}
  ${ctx.userName ? `• Name: ${ctx.userName}` : ''}
  • Account identifiers, profile data, and inferred data
  • Device, IP, or behavioral records tied to my identity
  • Data shared with service providers or third parties where deletion is required
${brokerSpecificBlock}

Please:
  1. Confirm receipt of this request
  2. Complete deletion within your legally required response period
  3. Confirm whether any exceptions are applied and identify the legal basis
  4. Confirm deletion instructions were sent to relevant processors, where required

If additional verification is needed, please provide the minimum necessary process.

Regards,

${ctx.userName || '[YOUR FULL NAME]'}
${ctx.userEmail}

─────────────────────────────────────────────────────────
⚠ DISCLAIMER: This is an informational template generated
by GhostScan. It does not constitute legal advice. For
advice specific to your situation, consult a qualified
privacy attorney.
Reference: ${refId}
─────────────────────────────────────────────────────────`;
  return { subject, body };
}

// ── Breach Notification Erasure ───────────────────────────────
function breachErasure(ctx: LegalEmailContext, refId: string): { subject: string; body: string } {
  const stateLawPart = ctx.stateLawName ? `${ctx.stateLawName}` : 'CCPA §1798.105';
  const subject = `Data Breach Erasure & Notification Request — ${ctx.targetName} — GDPR Art.17 / ${stateLawPart} — Ref: ${refId}`;
  const body = `To the Data Protection Officer / Chief Privacy Officer at ${ctx.targetName},

Date: ${today()}
Reference Number: ${refId}
Data Subject: ${ctx.userEmail}

═══════════════════════════════════════════════════════
  FORMAL DATA BREACH ERASURE REQUEST
  GDPR Articles 17, 33, 34 | ${stateLawPart}
═══════════════════════════════════════════════════════

I am writing following the security incident affecting ${ctx.targetName}${ctx.breachDate ? ` on or around ${new Date(ctx.breachDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}` : ''}, which resulted in the exposure of my personal data.

BREACH DETAILS (as reported):
  Organisation: ${ctx.targetName}
  ${ctx.breachDate ? `Approximate Date: ${ctx.breachDate}` : ''}
  ${ctx.dataClasses && ctx.dataClasses.length > 0 ? `Data Categories Exposed:\n${ctx.dataClasses.map(d => `    • ${d}`).join('\n')}` : ''}

PART 1 — RIGHT TO ERASURE (GDPR Art.17 / ${stateLawPart})

I hereby request permanent erasure of ALL personal data you hold about me, including but not limited to the categories exposed in the breach. Grounds include:

  (a) Unlawful processing — my data was not adequately secured [GDPR Art.17(1)(d)]
  (b) I object to further processing of data exposed in a breach [GDPR Art.17(1)(c)]
  (c) State deletion right under applicable U.S. privacy law [${stateLawPart}]

PART 2 — BREACH NOTIFICATION INFORMATION (GDPR Art.34)

I request the following information regarding the breach:

  1. Exact categories and volume of my personal data that was accessed
  2. Identity (or description) of the unauthorised party/parties
  3. Approximate date on which the breach was discovered
  4. Date on which your supervisory authority was notified (GDPR Art.33: 72-hour requirement)
  5. Steps taken to remediate the breach and prevent recurrence
  6. Contact details for your Data Protection Officer

PART 3 — U.S. STATE BREACH RIGHTS

Where applicable under U.S. state privacy and consumer-protection law, I reserve all rights and remedies related to negligent data protection and breach harm.

REQUIRED ACTIONS:
  ☐ Acknowledge this request within 72 hours (GDPR) / your state-law response timeline
  ☐ Complete erasure within 30 days (GDPR) / your state-law completion timeline
  ☐ Provide breach notification details listed in Part 2
  ☐ Confirm erasure instruction to all third-party processors

Yours faithfully,

${ctx.userName || '[YOUR FULL NAME]'}
${ctx.userEmail}

─────────────────────────────────────────────────────────
⚠ DISCLAIMER: This is an informational template generated
by GhostScan. It does not constitute legal advice. For
legal advice about data breach claims or GDPR enforcement,
consult a qualified solicitor or privacy attorney.
Reference: ${refId}
─────────────────────────────────────────────────────────`;
  return { subject, body };
}

// ── Main export ────────────────────────────────────────────────
export function generateLegalEmail(ctx: LegalEmailContext): LegalEmailOutput {
  const refId = ctx.refId ?? genRefId();
  let result: { subject: string; body: string };

  switch (ctx.regime) {
    case 'gdpr':
      result = gdprErasure(ctx, refId);
      break;
    case 'ccpa':
      result = ccpaDeletion(ctx, refId);
      break;
    case 'us_state_delete':
      result = usStateDeletion(ctx, refId);
      break;
    case 'breach_erasure':
      result = breachErasure(ctx, refId);
      break;
    default:
      result = gdprErasure(ctx, refId);
  }

  const filename = `${ctx.regime}-deletion-${ctx.targetName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${refId}.txt`;

  return {
    to: ctx.targetEmail,
    subject: result.subject,
    body: result.body,
    filename,
    refId,
    regime: ctx.regime,
  };
}

export function generateEmlContent(output: LegalEmailOutput): string {
  return `MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 7bit
To: ${output.to}
Subject: ${output.subject}
X-Generated-By: GhostScan-LegalEngine/1.0
X-Reference-ID: ${output.refId}
X-Template-Regime: ${output.regime}
Date: ${new Date().toUTCString()}

${output.body}`;
}

export function generateMailtoUrl(output: LegalEmailOutput): string {
  return `mailto:${encodeURIComponent(output.to)}?subject=${encodeURIComponent(output.subject)}&body=${encodeURIComponent(output.body)}`;
}
