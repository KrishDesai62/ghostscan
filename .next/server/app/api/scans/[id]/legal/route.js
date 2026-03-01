"use strict";(()=>{var e={};e.id=25,e.ids=[25],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4300:e=>{e.exports=require("buffer")},8694:(e,t,a)=>{a.r(t),a.d(t,{headerHooks:()=>y,originalPathname:()=>R,patchFetch:()=>b,requestAsyncStorage:()=>h,routeModule:()=>m,serverHooks:()=>f,staticGenerationAsyncStorage:()=>p,staticGenerationBailout:()=>g});var r={};a.r(r),a.d(r,{GET:()=>u});var i=a(5419),o=a(9108),n=a(9678),s=a(8070),l=a(7699),c=a(2455);function d(){return new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}async function u(e,{params:t}){let a=(0,l.createRouteHandlerClient)({cookies:c.cookies}),{data:{session:r}}=await a.auth.getSession();if(!r)return s.Z.json({error:"Unauthorized"},{status:401});let i=new URL(e.url),o=i.searchParams.get("regime")??"gdpr";i.searchParams.get("targetId");let n=i.searchParams.get("targetName"),u=i.searchParams.get("targetEmail"),m=i.searchParams.get("format")??"json",{data:h}=await a.from("users").select("email").eq("id",r.user.id).single();if(!h)return s.Z.json({error:"User not found"},{status:404});let{data:p}=await a.from("scans").select("*, breaches(*)").eq("id",t.id).eq("user_id",r.user.id).single();if(!p)return s.Z.json({error:"Scan not found"},{status:404});let f=p.breaches?.find(e=>e.breach_name===n),y=function(e){let t;let a=e.refId??`GS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;switch(e.regime){case"gdpr":default:t={subject:`Right to Erasure Request — GDPR Article 17 — ${e.targetName} — Ref: ${a}`,body:`To the Data Protection Officer at ${e.targetName},

Date: ${d()}
Reference Number: ${a}
Data Subject: ${e.userEmail}

═══════════════════════════════════════════════════════
  FORMAL SUBJECT ACCESS & ERASURE REQUEST
  General Data Protection Regulation — Article 15 & 17
═══════════════════════════════════════════════════════

I am writing to formally exercise my rights under the General Data Protection Regulation (EU) 2016/679 (GDPR) and, where applicable, the UK GDPR and Data Protection Act 2018.

I hereby request that ${e.targetName} ("the Controller"):

1. ERASURE (Article 17 — Right to Be Forgotten)
   Permanently erase all personal data you hold about me, including:
   • My email address: ${e.userEmail}
   ${e.userName?`• My name: ${e.userName}`:"• Any name associated with my email address"}
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
   I am the owner of the email address ${e.userEmail}. If you require additional verification, please specify your preferred process. Note that requiring disproportionate identification is itself a potential GDPR violation.

If you are unable to honour this request in full, please provide written grounds citing the specific legal basis for any exception claimed.

Failure to respond within 30 days of confirmed receipt may result in a complaint to the relevant supervisory authority (ICO if UK-based; the relevant EU Member State DPA; or the Irish DPC for EU-based controllers).

This letter constitutes a formal legal request and should be treated accordingly and escalated to your Data Protection Officer without delay.

Yours faithfully,

${e.userName||"[YOUR FULL NAME]"}
${e.userEmail}

─────────────────────────────────────────────────────────
⚠ DISCLAIMER: This is an informational template generated
by GhostScan. It does not constitute legal advice. For
advice specific to your situation, consult a qualified
solicitor or data protection attorney.
Reference: ${a}
─────────────────────────────────────────────────────────`};break;case"ccpa":t={subject:`CCPA Deletion Request — Cal. Civ. Code \xa71798.105 — ${e.targetName} — Ref: ${a}`,body:`To the Privacy Department / Legal Team at ${e.targetName},

Date: ${d()}
Reference Number: ${a}
Consumer Email: ${e.userEmail}

═══════════════════════════════════════════════════════
  CALIFORNIA CONSUMER PRIVACY ACT — DELETION REQUEST
  California Civil Code Section 1798.105
  (As amended by CPRA — effective January 1, 2023)
═══════════════════════════════════════════════════════

I am a California resident and am hereby submitting a verified consumer request for deletion of my personal information pursuant to the California Consumer Privacy Act of 2018 (CCPA), as amended by the California Privacy Rights Act (CPRA), California Civil Code Section 1798.105.

CONSUMER IDENTIFYING INFORMATION:
  Email Address: ${e.userEmail}
  ${e.userName?`Full Name: ${e.userName}`:""}

REQUEST FOR DELETION:
I request that ${e.targetName} and its service providers delete all personal information that has been collected, purchased, or otherwise obtained about me.

This request covers, but is not limited to:
  • Identifiers: name, alias, postal address, email address, IP address, account name
  • Personal records: telephone number, employment history, financial information
  • Commercial information: purchasing history, browsing history, products considered
  • Internet or network activity: browsing history, search history, interaction data
  • Geolocation data
  • Professional or employment-related information
  • Inferences drawn to create a consumer profile

YOUR OBLIGATIONS UNDER CCPA \xa71798.105(c):
  1. DELETE the consumer's personal information from your records
  2. DIRECT all service providers to delete the consumer's personal information
  3. ACKNOWLEDGE this request within 10 business days (\xa71798.105(b))
  4. COMPLETE the deletion within 45 calendar days of receipt
     (Extension of up to 45 additional days permitted with written notice)

PLEASE NOTE:
  • I am not required to create an account to submit this request
  • You may not charge a fee for processing this request
  • Deletion must extend to service providers and third parties to whom you have sold my data
  • Under CPRA \xa71798.121, I also request you do not sell or share my personal information

If you believe an exception under \xa71798.105(d) applies, please identify the specific exception in writing.

Non-compliance may result in a complaint to the California Privacy Protection Agency and/or the California Attorney General's office (which may impose civil penalties of $2,500–$7,500 per intentional violation).

Respectfully submitted,

${e.userName||"[YOUR FULL NAME]"}
${e.userEmail}
[YOUR CALIFORNIA ADDRESS]

─────────────────────────────────────────────────────────
⚠ DISCLAIMER: This is an informational template generated
by GhostScan. It does not constitute legal advice. For
advice specific to your situation, consult a qualified
California privacy attorney.
Reference: ${a}
─────────────────────────────────────────────────────────`};break;case"us_state_delete":t=function(e,t){let a=e.stateLabel||"my U.S. state",r=e.stateLawName||"applicable state privacy law";return{subject:`Consumer Data Deletion Request — ${r} — ${e.targetName} — Ref: ${t}`,body:`To the Privacy Team at ${e.targetName},

Date: ${d()}
Reference Number: ${t}
Consumer Email: ${e.userEmail}
State of Residence: ${a}

═══════════════════════════════════════════════════════
  STATE PRIVACY LAW DELETION REQUEST
  ${r}
═══════════════════════════════════════════════════════

I am a resident of ${a} and am exercising my consumer deletion rights under ${r} and other applicable U.S. privacy law obligations.

I request that ${e.targetName} delete personal information associated with my account and identifiers, including:
  • Email: ${e.userEmail}
  ${e.userName?`• Name: ${e.userName}`:""}
  • Account identifiers, profile data, and inferred data
  • Device, IP, or behavioral records tied to my identity
  • Data shared with service providers or third parties where deletion is required

Please:
  1. Confirm receipt of this request
  2. Complete deletion within your legally required response period
  3. Confirm whether any exceptions are applied and identify the legal basis
  4. Confirm deletion instructions were sent to relevant processors, where required

If additional verification is needed, please provide the minimum necessary process.

Regards,

${e.userName||"[YOUR FULL NAME]"}
${e.userEmail}

─────────────────────────────────────────────────────────
⚠ DISCLAIMER: This is an informational template generated
by GhostScan. It does not constitute legal advice. For
advice specific to your situation, consult a qualified
privacy attorney.
Reference: ${t}
─────────────────────────────────────────────────────────`}}(e,a);break;case"breach_erasure":t=function(e,t){let a=e.stateLawName?`${e.stateLawName}`:"CCPA \xa71798.105";return{subject:`Data Breach Erasure & Notification Request — ${e.targetName} — GDPR Art.17 / ${a} — Ref: ${t}`,body:`To the Data Protection Officer / Chief Privacy Officer at ${e.targetName},

Date: ${d()}
Reference Number: ${t}
Data Subject: ${e.userEmail}

═══════════════════════════════════════════════════════
  FORMAL DATA BREACH ERASURE REQUEST
  GDPR Articles 17, 33, 34 | ${a}
═══════════════════════════════════════════════════════

I am writing following the security incident affecting ${e.targetName}${e.breachDate?` on or around ${new Date(e.breachDate).toLocaleDateString("en-US",{year:"numeric",month:"long"})}`:""}, which resulted in the exposure of my personal data.

BREACH DETAILS (as reported):
  Organisation: ${e.targetName}
  ${e.breachDate?`Approximate Date: ${e.breachDate}`:""}
  ${e.dataClasses&&e.dataClasses.length>0?`Data Categories Exposed:
${e.dataClasses.map(e=>`    • ${e}`).join("\n")}`:""}

PART 1 — RIGHT TO ERASURE (GDPR Art.17 / ${a})

I hereby request permanent erasure of ALL personal data you hold about me, including but not limited to the categories exposed in the breach. Grounds include:

  (a) Unlawful processing — my data was not adequately secured [GDPR Art.17(1)(d)]
  (b) I object to further processing of data exposed in a breach [GDPR Art.17(1)(c)]
  (c) State deletion right under applicable U.S. privacy law [${a}]

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

${e.userName||"[YOUR FULL NAME]"}
${e.userEmail}

─────────────────────────────────────────────────────────
⚠ DISCLAIMER: This is an informational template generated
by GhostScan. It does not constitute legal advice. For
legal advice about data breach claims or GDPR enforcement,
consult a qualified solicitor or privacy attorney.
Reference: ${t}
─────────────────────────────────────────────────────────`}}(e,a)}let r=`${e.regime}-deletion-${e.targetName.toLowerCase().replace(/[^a-z0-9]/g,"-")}-${a}.txt`;return{to:e.targetEmail,subject:t.subject,body:t.body,filename:r,refId:a,regime:e.regime}}({userEmail:h.email,targetName:n??"Data Controller",targetEmail:u??"privacy@example.com",regime:f?"breach_erasure":o,dataClasses:f?.data_classes,breachDate:f?.breach_date});return(await a.from("legal_exports").insert({scan_id:p.id,regime:y.regime,template_version:"1.0",target_name:n,target_email:u}),"eml"===m)?new s.Z(`MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 7bit
To: ${y.to}
Subject: ${y.subject}
X-Generated-By: GhostScan-LegalEngine/1.0
X-Reference-ID: ${y.refId}
X-Template-Regime: ${y.regime}
Date: ${new Date().toUTCString()}

${y.body}`,{headers:{"Content-Type":"message/rfc822","Content-Disposition":`attachment; filename="${y.filename.replace(".txt",".eml")}"`}}):"txt"===m?new s.Z(`To: ${y.to}
Subject: ${y.subject}

${y.body}`,{headers:{"Content-Type":"text/plain","Content-Disposition":`attachment; filename="${y.filename}"`}}):s.Z.json({...y,mailtoUrl:`mailto:${encodeURIComponent(y.to)}?subject=${encodeURIComponent(y.subject)}&body=${encodeURIComponent(y.body)}`})}let m=new i.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/scans/[id]/legal/route",pathname:"/api/scans/[id]/legal",filename:"route",bundlePath:"app/api/scans/[id]/legal/route"},resolvedPagePath:"/Users/krishd/Downloads/ghostscan/src/app/api/scans/[id]/legal/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:h,staticGenerationAsyncStorage:p,serverHooks:f,headerHooks:y,staticGenerationBailout:g}=m,R="/api/scans/[id]/legal/route";function b(){return(0,n.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:p})}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[638,206,950,349],()=>a(8694));module.exports=r})();