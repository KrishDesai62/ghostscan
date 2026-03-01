// GhostScan v2 — Enhanced with all requested improvements
import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// REGION / LEGAL FRAMEWORK DATA
// ============================================================
const REGIONS = {
  // US States with specific privacy laws
  "US-CA": { label: "California, USA", laws: ["CCPA","CPRA"], regime: "ccpa", deadline: 45, ackDeadline: 10, authority: "California Attorney General", authorityUrl: "https://oag.ca.gov/privacy/ccpa", flag: "🇺🇸" },
  "US-VA": { label: "Virginia, USA", laws: ["VCDPA"], regime: "ccpa", deadline: 45, ackDeadline: 10, authority: "Virginia AG", flag: "🇺🇸" },
  "US-CO": { label: "Colorado, USA", laws: ["CPA"], regime: "ccpa", deadline: 45, ackDeadline: 10, authority: "Colorado AG", flag: "🇺🇸" },
  "US-CT": { label: "Connecticut, USA", laws: ["CTDPA"], regime: "ccpa", deadline: 45, ackDeadline: 10, authority: "Connecticut AG", flag: "🇺🇸" },
  "US-TX": { label: "Texas, USA", laws: ["TDPSA"], regime: "ccpa", deadline: 45, ackDeadline: 10, authority: "Texas AG", flag: "🇺🇸" },
  "US-FL": { label: "Florida, USA", laws: ["FDBR"], regime: "ccpa", deadline: 45, ackDeadline: 10, authority: "Florida AG", flag: "🇺🇸" },
  "US-OTHER": { label: "Other US State", laws: ["FTC Act","State law"], regime: "ccpa", deadline: 45, ackDeadline: 10, authority: "FTC / State AG", flag: "🇺🇸" },
  // EU/EEA
  "EU-DE": { label: "Germany", laws: ["GDPR","BDSG"], regime: "gdpr", deadline: 30, ackDeadline: 1, authority: "BfDI", authorityUrl: "https://www.bfdi.bund.de", flag: "🇩🇪" },
  "EU-FR": { label: "France", laws: ["GDPR","Loi Informatique"], regime: "gdpr", deadline: 30, ackDeadline: 1, authority: "CNIL", authorityUrl: "https://www.cnil.fr", flag: "🇫🇷" },
  "EU-ES": { label: "Spain", laws: ["GDPR","LOPDGDD"], regime: "gdpr", deadline: 30, ackDeadline: 1, authority: "AEPD", flag: "🇪🇸" },
  "EU-IT": { label: "Italy", laws: ["GDPR","Codice Privacy"], regime: "gdpr", deadline: 30, ackDeadline: 1, authority: "Garante", flag: "🇮🇹" },
  "EU-NL": { label: "Netherlands", laws: ["GDPR","AVG"], regime: "gdpr", deadline: 30, ackDeadline: 1, authority: "AP", flag: "🇳🇱" },
  "EU-OTHER": { label: "EU / EEA (Other)", laws: ["GDPR"], regime: "gdpr", deadline: 30, ackDeadline: 1, authority: "Local DPA", flag: "🇪🇺" },
  // UK
  "GB": { label: "United Kingdom", laws: ["UK GDPR","DPA 2018"], regime: "gdpr", deadline: 30, ackDeadline: 1, authority: "ICO", authorityUrl: "https://ico.org.uk", flag: "🇬🇧" },
  // Others
  "BR": { label: "Brazil", laws: ["LGPD"], regime: "lgpd", deadline: 15, ackDeadline: 3, authority: "ANPD", flag: "🇧🇷" },
  "CA": { label: "Canada", laws: ["PIPEDA","Law 25 (QC)"], regime: "pipeda", deadline: 30, ackDeadline: 5, authority: "OPC", flag: "🇨🇦" },
  "AU": { label: "Australia", laws: ["Privacy Act 1988"], regime: "apa", deadline: 30, ackDeadline: 5, authority: "OAIC", flag: "🇦🇺" },
  "JP": { label: "Japan", laws: ["APPI"], regime: "appi", deadline: 30, ackDeadline: 5, authority: "PPC", flag: "🇯🇵" },
  "SG": { label: "Singapore", laws: ["PDPA"], regime: "pdpa", deadline: 30, ackDeadline: 5, authority: "PDPC", flag: "🇸🇬" },
  "OTHER": { label: "Other / Not Sure", laws: ["General best practices"], regime: "ccpa", deadline: 45, ackDeadline: 10, authority: "Relevant Authority", flag: "🌐" },
};

const REGION_GROUPS = [
  { group: "United States", regions: ["US-CA","US-VA","US-CO","US-CT","US-TX","US-FL","US-OTHER"] },
  { group: "European Union / EEA", regions: ["EU-DE","EU-FR","EU-ES","EU-IT","EU-NL","EU-OTHER"] },
  { group: "United Kingdom", regions: ["GB"] },
  { group: "Other Regions", regions: ["BR","CA","AU","JP","SG","OTHER"] },
];

// ============================================================
// DISPOSABLE DOMAINS
// ============================================================
const DISPOSABLE_DOMAINS = ["mailinator.com","guerrillamail.com","temp-mail.org","throwaway.email","yopmail.com","10minutemail.com","trashmail.com","fakeinbox.com"];

// ============================================================
// DATA BROKERS
// ============================================================
const DATA_BROKERS = [
  { id: "spokeo", name: "Spokeo", category: "People Search", privacyEmail: "privacy@spokeo.com", privacyUrl: "https://www.spokeo.com/optout", regime: ["ccpa","gdpr"], autoOptOut: true, confidence: "high", dataSource: "Public records + social" },
  { id: "whitepages", name: "Whitepages", category: "People Search", privacyEmail: "support@whitepages.com", privacyUrl: "https://www.whitepages.com/suppression_requests", regime: ["ccpa"], autoOptOut: true, confidence: "high", dataSource: "Public records" },
  { id: "intelius", name: "Intelius", category: "People Search", privacyEmail: "privacy@intelius.com", privacyUrl: "https://www.intelius.com/opt-out", regime: ["ccpa"], autoOptOut: true, confidence: "high", dataSource: "Background records" },
  { id: "beenverified", name: "BeenVerified", category: "Background Check", privacyEmail: "optout@beenverified.com", privacyUrl: "https://www.beenverified.com/app/optout/search", regime: ["ccpa"], autoOptOut: false, confidence: "high", dataSource: "Background + court" },
  { id: "mylife", name: "MyLife", category: "Reputation", privacyEmail: "privacy@mylife.com", privacyUrl: "https://www.mylife.com/privacy-policy", regime: ["ccpa","gdpr"], autoOptOut: false, confidence: "medium", dataSource: "Aggregated profiles" },
  { id: "peoplefinder", name: "PeopleFinder", category: "People Search", privacyEmail: "privacy@peoplefinders.com", privacyUrl: "https://www.peoplefinders.com/opt-out", regime: ["ccpa"], autoOptOut: true, confidence: "high", dataSource: "Public records" },
  { id: "radaris", name: "Radaris", category: "Data Broker", privacyEmail: "privacy@radaris.com", privacyUrl: "https://radaris.com/page/how-to-remove", regime: ["ccpa","gdpr"], autoOptOut: false, confidence: "medium", dataSource: "Web aggregation" },
  { id: "acxiom", name: "Acxiom", category: "Data Aggregator", privacyEmail: "optout@acxiom.com", privacyUrl: "https://www.acxiom.com/optout/", regime: ["ccpa","gdpr"], autoOptOut: false, confidence: "high", dataSource: "Commercial data" },
  { id: "epsilon", name: "Epsilon", category: "Marketing Data", privacyEmail: "privacy@epsilon.com", privacyUrl: "https://www.epsilon.com/us/privacy-policy", regime: ["ccpa","gdpr"], autoOptOut: false, confidence: "medium", dataSource: "Marketing database" },
  { id: "corelogic", name: "CoreLogic", category: "Property Data", privacyEmail: "privacy@corelogic.com", privacyUrl: "https://www.corelogic.com/privacy-center", regime: ["ccpa"], autoOptOut: false, confidence: "high", dataSource: "Property records" },
  { id: "experian", name: "Experian Marketing", category: "Credit/Marketing", privacyEmail: "privacy@experian.com", privacyUrl: "https://www.experian.com/privacy/opting_out_prescreen_offers.html", regime: ["ccpa","gdpr"], autoOptOut: false, confidence: "high", dataSource: "Credit bureau data" },
  { id: "lexisnexis", name: "LexisNexis", category: "Data Aggregator", privacyEmail: "privacy@lexisnexis.com", privacyUrl: "https://optout.lexisnexis.com/", regime: ["ccpa","gdpr"], autoOptOut: false, confidence: "high", dataSource: "Legal + public records" },
];

// ============================================================
// MOCK BREACHES — tagged with confidence levels
// ============================================================
const MOCK_BREACHES = [
  { id: "b1", breach_name: "LinkedIn", breach_domain: "linkedin.com", breach_date: "2021-06-22", pwn_count: 700000000, data_classes: ["Email addresses","Names","Phone numbers","Professional experience"], is_verified: true, confidence: "verified", source: "HIBP Public Dataset", privacyEmail: "privacy@linkedin.com" },
  { id: "b2", breach_name: "Adobe", breach_domain: "adobe.com", breach_date: "2013-10-04", pwn_count: 153000000, data_classes: ["Email addresses","Password hints","Passwords","Usernames"], is_verified: true, confidence: "verified", source: "HIBP Public Dataset", privacyEmail: "privacy@adobe.com" },
  { id: "b3", breach_name: "Canva", breach_domain: "canva.com", breach_date: "2019-05-24", pwn_count: 137272116, data_classes: ["Email addresses","Geographic locations","Names","Passwords","Usernames"], is_verified: true, confidence: "verified", source: "HIBP Public Dataset", privacyEmail: "privacy@canva.com" },
  { id: "b4", breach_name: "Dropbox", breach_domain: "dropbox.com", breach_date: "2012-07-01", pwn_count: 68648009, data_classes: ["Email addresses","Passwords"], is_verified: true, confidence: "verified", source: "HIBP Public Dataset", privacyEmail: "privacy@dropbox.com" },
  { id: "b5", breach_name: "Twitter", breach_domain: "twitter.com", breach_date: "2022-11-27", pwn_count: 211524284, data_classes: ["Email addresses","Phone numbers"], is_verified: true, confidence: "verified", source: "HIBP Public Dataset", privacyEmail: "privacy@twitter.com" },
];

// ============================================================
// OTP RATE LIMITING (in-memory, client-side simulation)
// ============================================================
const OTP_STORE = {
  codes: {},
  attempts: {},
  lastSent: {},
  generate(email) {
    const now = Date.now();
    // Rate limit: max 3 sends per hour per email
    const sends = (this.lastSent[email] || []).filter(t => now - t < 3600000);
    if (sends.length >= 3) return { error: "rate_limit", retryAfter: Math.ceil((sends[0] + 3600000 - now) / 60000) };
    this.lastSent[email] = [...sends, now];
    // Generate 6-digit code, expires in 10 minutes
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.codes[email] = { code, expires: now + 600000, used: false };
    this.attempts[email] = 0;
    return { code, message: `OTP sent (demo: ${code})` };
  },
  verify(email, input) {
    const record = this.codes[email];
    if (!record) return { error: "no_otp" };
    if (record.used) return { error: "already_used" };
    if (Date.now() > record.expires) return { error: "expired" };
    this.attempts[email] = (this.attempts[email] || 0) + 1;
    if (this.attempts[email] > 5) return { error: "too_many_attempts" };
    if (input !== record.code) return { error: "wrong_code", remaining: 5 - this.attempts[email] };
    record.used = true;
    return { success: true };
  }
};

// ============================================================
// RISK SCORING ENGINE
// ============================================================
function computeRiskScore(signals) {
  const { breachCount, hasPassword, hasPasswordHash, hasName, hasPhone, hasAddress, hasDOB, hasGravatar, isDisposable, isPredictable, uses2FA, reusesPasswords, usesPasswordManager, mostRecentBreachYear } = signals;
  const currentYear = new Date().getFullYear();
  const recentBreach = mostRecentBreachYear && (currentYear - mostRecentBreachYear) < 2;

  let takeover = 0;
  if (hasPassword) takeover += 40;
  if (hasPasswordHash) takeover += 30;
  takeover += Math.min(breachCount * 10, 60);
  if (recentBreach) takeover += 20;
  if (reusesPasswords) takeover += 30;
  if (!uses2FA) takeover += 20;
  if (usesPasswordManager) takeover -= 15;
  takeover = Math.max(0, Math.min(100, takeover));

  let theft = 0;
  if (hasName) theft += 20;
  if (hasPhone) theft += 25;
  if (hasAddress) theft += 30;
  if (hasDOB) theft += 35;
  theft = Math.max(0, Math.min(100, theft));

  let phishing = 0;
  if (hasName) phishing += 20;
  if (hasGravatar) phishing += 15;
  if (recentBreach) phishing += 15;
  if (breachCount > 3) phishing += 10;
  if (isDisposable) phishing += 10;
  phishing = Math.max(0, Math.min(100, phishing));

  let exposure = 0;
  if (hasGravatar) exposure += 20;
  if (isPredictable) exposure += 20;
  if (isDisposable) exposure += 15;
  if (breachCount > 0) exposure += 15;
  if (breachCount > 3) exposure += 10;
  exposure = Math.max(0, Math.min(100, exposure));

  const finalScore = Math.round(0.35 * takeover + 0.25 * theft + 0.20 * phishing + 0.20 * exposure);
  const level = finalScore < 35 ? "low" : finalScore < 65 ? "moderate" : "high";
  return { finalScore, level, dimensions: { takeover, theft, phishing, exposure } };
}

// ============================================================
// RISK HISTORY (simulated time-series)
// ============================================================
function generateRiskHistory(currentScore) {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const variance = (Math.random() - 0.5) * 12;
    const trend = i * -0.8; // trend upward toward current
    const score = Math.max(10, Math.min(95, currentScore + trend + variance));
    months.push({ label, score: Math.round(score) });
  }
  months[months.length - 1].score = currentScore;
  return months;
}

// ============================================================
// REGION-AWARE EMAIL TEMPLATES
// ============================================================
function generateDeletionEmail({ userEmail, targetName, targetEmail, regionKey, dataClasses, breachDate, requestType }) {
  const region = REGIONS[regionKey] || REGIONS["OTHER"];
  const regime = region.regime;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const refId = `GS-${Date.now().toString(36).toUpperCase()}-${regionKey || "INT"}`;
  const deadline = region.deadline;
  const ackDeadline = region.ackDeadline;
  const authority = region.authority;
  const laws = region.laws.join(", ");

  if (requestType === "breach_notification_erasure") {
    const subject = `Data Erasure Request — ${laws} — Breach Incident — ${refId}`;
    const body = `To the Data Protection Officer / Privacy Team at ${targetName},

Date: ${today}
Reference: ${refId}
Applicable Law(s): ${laws}
My Email Address: ${userEmail}
Region: ${region.label}

FORMAL REQUEST FOR ERASURE — DATA BREACH INCIDENT

I am writing to formally request the permanent deletion of all personal data held about me by ${targetName}, following your involvement in a data security incident that exposed my personal information${breachDate ? ` on or around ${breachDate}` : ""}.

Exposed data categories include, but may not be limited to:
${(dataClasses || []).map(d => `  • ${d}`).join("\n")}

Legal grounds for this request:
${regime === "gdpr" ? `  1. GDPR Article 17(1)(d) — unlawful processing following the breach.
  2. GDPR Article 17(1)(c) — I object to further processing under Article 21.
  3. UK GDPR equivalent provisions (if applicable).` : regime === "lgpd" ? `  1. LGPD Article 18(IV) — right to erasure of unnecessary data.
  2. LGPD Article 18(VI) — right to anonymisation or deletion.` : regime === "pipeda" ? `  1. PIPEDA Principle 4.3.8 — withdrawal of consent.
  2. PIPEDA Principle 4.9 — right to access and challenge accuracy.` : `  1. ${laws} — Right to delete personal information.
  2. FTC Act Section 5 — Unfair or deceptive acts or practices.`}

Required actions within ${deadline} days of this request:
  (a) Permanently delete all personal data about me from all active systems, backups, and third-party processors.
  (b) Provide written confirmation of deletion within ${deadline} calendar days.
  (c) Notify all third parties to whom you have disclosed my data of this erasure request.
  (d) Provide details of what data was accessed, by whom, and any protective measures taken.

Please acknowledge receipt of this request within ${ackDeadline} business day(s).

Do not require me to create an account or login to honour this request — this is not a lawful condition a data controller may impose.

Failure to comply within the statutory timeframe may result in a complaint to the ${authority}.

Yours sincerely,

[YOUR FULL NAME]
${userEmail}
[YOUR ADDRESS]

---
DISCLAIMER: This template is provided for informational purposes only and does not constitute legal advice. Consult a qualified attorney for advice specific to your situation.
Reference: ${refId}`;
    return { subject, body, filename: `deletion-breach-${targetName.toLowerCase().replace(/\s+/g, "-")}-${refId}.txt`, refId, regime, laws, deadline };
  }

  if (regime === "gdpr") {
    const subject = `Right to Erasure Request — GDPR Article 17 / ${laws} — ${targetName} — ${refId}`;
    const body = `To the Data Protection Officer at ${targetName},

Date: ${today}
Reference: ${refId}
Data Subject Email: ${userEmail}
Applicable Law: ${laws}
Region: ${region.label}

FORMAL RIGHT TO ERASURE REQUEST — ${laws.toUpperCase()}

I am writing to exercise my right to erasure ("right to be forgotten") under ${laws}, applicable to data controllers processing the personal data of individuals in ${region.label}.

I request that ${targetName} immediately and permanently erase all personal data held about me, including:
  • My email address: ${userEmail}
  • Any name, phone number, address, date of birth, or other identifying information associated with me
  • Any inferred, derived, or profiled data built from my information
  • All records in active databases, archives, and backup systems
  • All data shared with or sold to third-party processors, affiliates, or advertisers

Grounds for erasure:
  1. GDPR Article 17(1)(a) — Data no longer necessary for original purpose.
  2. GDPR Article 17(1)(c) — I object to processing under Article 21.
  3. GDPR Article 17(1)(d) — Data may have been unlawfully processed.

Required timeline:
  • Acknowledge receipt within ${ackDeadline} business day(s).
  • Complete deletion within ${deadline} calendar days of this request.
  • Notify all sub-processors and third parties.
  • If exemptions under Article 17(3) are claimed, provide specific legal grounds in writing.

I did not consent to having my data collected and processed by your organisation for data brokerage purposes, and I do not have a direct contractual relationship with ${targetName} for such purposes.

Non-compliance may result in a complaint to the ${authority}.

Yours faithfully,

[YOUR FULL NAME]
${userEmail}

---
DISCLAIMER: Informational template only — not legal advice.
Reference: ${refId}`;
    return { subject, body, filename: `gdpr-erasure-${targetName.toLowerCase().replace(/\s+/g, "-")}-${refId}.txt`, refId, regime, laws, deadline };
  }

  if (regime === "lgpd") {
    const subject = `Solicitação de Exclusão de Dados — LGPD Art. 18 — ${targetName} — ${refId}`;
    const body = `Ao Encarregado de Dados (DPO) da ${targetName},

Data: ${today}
Referência: ${refId}
E-mail do titular: ${userEmail}
Lei aplicável: Lei Geral de Proteção de Dados (LGPD) — Lei nº 13.709/2018
Região: ${region.label}

SOLICITAÇÃO DE ELIMINAÇÃO DE DADOS PESSOAIS — LGPD ARTIGO 18

Nos termos do artigo 18 da LGPD, solicito formalmente a eliminação de todos os meus dados pessoais tratados pela ${targetName}.

Fundamentos legais:
  1. LGPD Art. 18, IV — Direito à anonimização, bloqueio ou eliminação de dados desnecessários.
  2. LGPD Art. 18, VI — Direito à eliminação de dados pessoais tratados com consentimento.

Prazo: ${deadline} dias para confirmação e conclusão.

Atenciosamente,
[SEU NOME COMPLETO]
${userEmail}

---
Este modelo é meramente informativo e não constitui assessoria jurídica.
Referência: ${refId}`;
    return { subject, body, filename: `lgpd-eliminacao-${targetName.toLowerCase().replace(/\s+/g, "-")}-${refId}.txt`, refId, regime, laws, deadline };
  }

  // CCPA / default
  const subject = `${laws} Deletion Request — ${targetName} — ${refId}`;
  const body = `To the Privacy Department at ${targetName},

Date: ${today}
Reference: ${refId}
Consumer Email: ${userEmail}
Applicable Law: ${laws}
Region: ${region.label}

FORMAL REQUEST TO DELETE PERSONAL INFORMATION — ${laws.toUpperCase()}

Pursuant to ${laws}, I hereby formally request the deletion of all personal information that ${targetName} has collected, purchased, or otherwise obtained about me.

Consumer Information:
  Email: ${userEmail}

Scope of deletion:
  • Contact information (name, address, phone, email)
  • Identifiers (IP addresses, device IDs, account IDs)
  • Commercial information (purchase history, browsing data)
  • Inferences drawn to create a consumer profile
  • Data purchased from or sold to third parties

Required response:
  (1) Acknowledge this request within ${ackDeadline} business day(s).
  (2) Delete all personal information within ${deadline} calendar days.
  (3) Direct service providers to delete my data.
  (4) If an extension is required, notify me of the reason within ${deadline} days.

Non-compliance may result in a complaint to the ${authority}.

Respectfully,

[YOUR FULL NAME]
${userEmail}
[YOUR ADDRESS IN ${region.label.toUpperCase()}]

---
DISCLAIMER: Informational template only — not legal advice.
Reference: ${refId}`;
  return { subject, body, filename: `privacy-deletion-${targetName.toLowerCase().replace(/\s+/g, "-")}-${refId}.txt`, refId, regime, laws, deadline };
}

// ============================================================
// UTILITIES
// ============================================================
function generateMailtoLink(toEmail, subject, body) {
  return `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function downloadTxt(filename, content) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function downloadEml(filename, toEmail, subject, body) {
  const content = `MIME-Version: 1.0\nContent-Type: text/plain; charset=UTF-8\nTo: ${toEmail}\nSubject: ${subject}\n\n${body}`;
  const blob = new Blob([content], { type: "message/rfc822" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename.replace(".txt", ".eml"); a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// AI CHAT ASSISTANT (calls Claude API)
// ============================================================
function AIChatAssistant({ scanData, regionKey, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hi! I'm your GhostScan AI assistant. I can help you understand your digital exposure, explain breach risks, and guide you through data removal steps. Your current risk score is **${scanData?.finalScore || "?"}** (${scanData?.level || "unknown"} risk). What would you like to know?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const region = REGIONS[regionKey] || REGIONS["OTHER"];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const systemPrompt = `You are GhostScan's privacy assistant. The user has just completed a digital exposure scan.

SCAN RESULTS:
- Risk Score: ${scanData?.finalScore}/100 (${scanData?.level} risk)
- Breaches Found: ${scanData?.breaches?.length || 0} (${scanData?.breaches?.map(b => b.breach_name).join(", ")})
- Dimensions: Account Takeover ${scanData?.dimensions?.takeover}, Identity Theft ${scanData?.dimensions?.theft}, Phishing ${scanData?.dimensions?.phishing}, Exposure ${scanData?.dimensions?.exposure}
- Uses 2FA: ${scanData?.signals?.uses2FA}, Reuses Passwords: ${scanData?.signals?.reusesPasswords}, Password Manager: ${scanData?.signals?.usesPasswordManager}
- User Region: ${region.label} (laws: ${region.laws.join(", ")})
- Report Type: ${scanData?.reportType}

Answer questions about:
1. What the scan results mean
2. How to improve their score
3. What data removal requests to send and how
4. Their rights under ${region.laws.join(", ")}
5. Breach-specific risks and mitigation steps
6. General privacy and security advice

Be concise, friendly, and actionable. Use plain language. Do not give legal advice — encourage consulting an attorney for specific legal questions. When referencing legal rights, mention they apply under ${region.laws.join(", ")} for ${region.label}.`;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = [...messages.slice(-8), userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: history
        })
      });
      const data = await res.json();
      const reply = data.content?.find(c => c.type === "text")?.text || "I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please check your network and try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, width: 380, height: 520, background: "#010a01", border: "1px solid #1e3a1e", borderRadius: 14, display: "flex", flexDirection: "column", zIndex: 2000, boxShadow: "0 0 40px rgba(0,255,102,0.1)" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #0f2a0f", background: "#020d02", borderRadius: "14px 14px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff66", boxShadow: "0 0 6px #00ff66" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#86efac", fontFamily: "monospace" }}>GhostScan AI Assistant</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: m.role === "user" ? "#052e16" : "#0a1a0a", border: `1px solid ${m.role === "user" ? "#166534" : "#1e3a1e"}`, fontSize: 12, color: "#d1fae5", lineHeight: 1.5, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 4, padding: "8px 12px" }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff66", animation: `bounce 1s ${i*0.2}s infinite` }} />)}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid #0f2a0f", display: "flex", gap: 6 }}>
        <input
          style={{ flex: 1, background: "#020d02", border: "1px solid #1e3a1e", borderRadius: 8, padding: "8px 10px", color: "#d1fae5", fontSize: 12, fontFamily: "monospace", outline: "none" }}
          placeholder="Ask about your exposure..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ background: "#00ff66", border: "none", borderRadius: 8, padding: "8px 12px", color: "#000", fontWeight: 900, cursor: "pointer", fontSize: 13 }}>→</button>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function GhostScan() {
  const [screen, setScreen] = useState("landing");
  const [email, setEmail] = useState("");
  const [regionKey, setRegionKey] = useState("US-CA");
  const [otpCode, setOtpCode] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [livenessStatus, setLivenessStatus] = useState("pending");
  const [livenessStep, setLivenessStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState("");
  const [scanData, setScanData] = useState(null);
  const [hygiene, setHygiene] = useState({ uses2FA: false, reusesPasswords: true, usesPasswordManager: false });
  const [simToggles, setSimToggles] = useState({ enable2FA: false, stopReuse: false, removeGravatar: false, usePasswordManager: false });
  const [deletionPanel, setDeletionPanel] = useState(false);
  const [deletionStatuses, setDeletionStatuses] = useState({});
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [emailPreview, setEmailPreview] = useState(null);
  const [activeTab, setActiveTab] = useState("brokers");
  const [consentChecks, setConsentChecks] = useState({ privacy: false, camera: false, processing: false });
  const [notification, setNotification] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const livenessTimer = useRef(null);

  const region = REGIONS[regionKey] || REGIONS["OTHER"];

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // OTP countdown timer
  useEffect(() => {
    if (!otpExpiry) return;
    const tick = setInterval(() => {
      const rem = Math.max(0, Math.floor((otpExpiry - Date.now()) / 1000));
      setOtpCountdown(rem);
      if (rem === 0) clearInterval(tick);
    }, 1000);
    return () => clearInterval(tick);
  }, [otpExpiry]);

  // ── Auth Flow ──────────────────────────────────────────────
  const handleEmailSubmit = () => {
    if (!email.includes("@") || !email.includes(".")) return;
    setScreen("otp");
    sendOtp();
  };

  const sendOtp = () => {
    setOtpSending(true);
    setOtpError("");
    setTimeout(() => {
      const result = OTP_STORE.generate(email);
      if (result.error === "rate_limit") {
        setOtpError(`Too many requests. Try again in ${result.retryAfter} min.`);
        setOtpSending(false);
        return;
      }
      setOtpCode(result.code);
      setOtpSent(true);
      setOtpExpiry(Date.now() + 600000);
      setOtpSending(false);
    }, 900);
  };

  const handleOtpVerify = () => {
    setOtpError("");
    const result = OTP_STORE.verify(email, otpInput);
    if (result.success) {
      setScreen("consent");
    } else {
      const msgs = {
        no_otp: "No code was sent. Please go back and request a new one.",
        already_used: "This code has already been used.",
        expired: "Code expired. Please request a new one.",
        too_many_attempts: "Too many failed attempts. Please start over.",
        wrong_code: `Incorrect code. ${result.remaining} attempt(s) remaining.`,
      };
      setOtpError(msgs[result.error] || "Verification failed.");
    }
  };

  const handleConsentNext = () => {
    if (consentChecks.privacy && consentChecks.processing) setScreen("liveness");
  };

  // ── Liveness ──────────────────────────────────────────────
  const livenessSteps = ["Look straight at camera", "Blink twice slowly", "Turn head left", "Return to center", "Turn head right", "Verification complete"];

  const startLiveness = () => {
    setLivenessStep(1);
    livenessTimer.current = setInterval(() => {
      setLivenessStep(prev => {
        if (prev >= livenessSteps.length) {
          clearInterval(livenessTimer.current);
          setLivenessStatus("passed");
          setTimeout(() => setScreen("hygiene"), 900);
          return prev;
        }
        return prev + 1;
      });
    }, 1300);
  };

  useEffect(() => () => clearInterval(livenessTimer.current), []);

  const skipLiveness = () => {
    setLivenessStatus("skipped");
    setScreen("hygiene");
  };

  // ── Scan ──────────────────────────────────────────────────
  const runScan = async () => {
    setScreen("scanning");
    const stages = [
      { label: "Validating identity…", pct: 10 },
      { label: "Querying breach databases (HIBP, DeHashed indices)…", pct: 30 },
      { label: "Cross-referencing verified public datasets…", pct: 50 },
      { label: "Checking data broker registries…", pct: 65 },
      { label: "Analyzing exposure vectors…", pct: 80 },
      { label: "Computing risk score…", pct: 92 },
      { label: "Building time-series analysis…", pct: 97 },
      { label: "Generating report…", pct: 100 },
    ];
    for (const s of stages) {
      setScanStage(s.label);
      setScanProgress(s.pct);
      await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
    }
    const signals = {
      breachCount: MOCK_BREACHES.length,
      hasPassword: true,
      hasPasswordHash: true,
      hasName: true,
      hasPhone: true,
      hasAddress: false,
      hasDOB: false,
      hasGravatar: true,
      isDisposable: DISPOSABLE_DOMAINS.some(d => email.endsWith("@" + d)),
      isPredictable: /^(info|admin|contact|hello|test)@/.test(email),
      uses2FA: hygiene.uses2FA,
      reusesPasswords: hygiene.reusesPasswords,
      usesPasswordManager: hygiene.usesPasswordManager,
      mostRecentBreachYear: 2022,
    };
    const score = computeRiskScore(signals);
    const history = generateRiskHistory(score.finalScore);
    setScanData({
      ...score,
      breaches: MOCK_BREACHES,
      signals,
      velocity: (MOCK_BREACHES.length / Math.max(1, new Date().getFullYear() - 2012 + 1)).toFixed(2),
      trend: "increasing",
      reportType: livenessStatus === "passed" ? "verified_full" : "limited_fallback",
      email,
      regionKey,
      history,
      dataSourceNote: "Demo: Breach data simulated from HIBP public dataset structure. In production, connect to https://haveibeenpwned.com/API/v3 (requires API key ~$4/month) or a self-hosted breach database.",
    });
    setScreen("dashboard");
  };

  // ── Simulation ────────────────────────────────────────────
  const simSignals = scanData ? {
    ...scanData.signals,
    uses2FA: simToggles.enable2FA || scanData.signals.uses2FA,
    reusesPasswords: simToggles.stopReuse ? false : scanData.signals.reusesPasswords,
    hasGravatar: simToggles.removeGravatar ? false : scanData.signals.hasGravatar,
    usesPasswordManager: simToggles.usePasswordManager || scanData.signals.usesPasswordManager,
  } : null;
  const simScore = simSignals ? computeRiskScore(simSignals) : null;
  const scoreDelta = simScore && scanData ? scanData.finalScore - simScore.finalScore : 0;

  // ── Deletion Center ────────────────────────────────────────
  const allTargets = [
    ...DATA_BROKERS.map(b => ({ ...b, type: "broker" })),
    ...(scanData?.breaches || []).map(b => ({
      id: b.id, name: b.breach_name, category: "Breached Service",
      privacyEmail: b.privacyEmail, privacyUrl: `https://${b.breach_domain}`,
      regime: [region.regime === "gdpr" ? "gdpr" : "ccpa"], type: "breach",
      confidence: b.confidence, dataSource: b.source,
      breach: b,
    })),
  ];
  const brokerTargets = allTargets.filter(t => t.type === "broker");
  const breachTargets = allTargets.filter(t => t.type === "breach");

  const openEmailPreview = (target) => {
    const effectiveRegime = target.regime?.includes(region.regime) ? region.regime : (target.regime?.[0] || "ccpa");
    const template = generateDeletionEmail({
      userEmail: email,
      targetName: target.name,
      targetEmail: target.privacyEmail,
      regionKey: scanData?.regionKey || "US-CA",
      dataClasses: target.breach?.data_classes,
      breachDate: target.breach?.breach_date,
      requestType: target.type === "breach" ? "breach_notification_erasure" : undefined,
    });
    setEmailPreview({ target, template, effectiveRegime });
    setSelectedTarget(target);
  };

  const markStatus = (targetId, status) => {
    // Only mark as sent AFTER user confirms the action was actually performed
    setDeletionStatuses(prev => ({ ...prev, [targetId]: { status, date: new Date().toLocaleDateString() } }));
    const msgs = { sent: "Marked as sent — reminder set for 30 days", deleted: "Confirmed deleted ✓", queued: "Queued for batch send", failed: "Marked as no-response" };
    showNotif(msgs[status] || `Status: ${status}`);
  };

  const sendAll = () => {
    allTargets.forEach(t => { if (!deletionStatuses[t.id]) markStatus(t.id, "queued"); });
    showNotif(`${allTargets.length} requests queued — open each to send`);
  };

  const statusColor = s => ({ sent: "#22c55e", queued: "#f59e0b", pending: "#374151", deleted: "#3b82f6", failed: "#ef4444" }[s] || "#374151");
  const statusIcon = s => ({ sent: "✉", queued: "⏳", pending: "○", deleted: "✓", failed: "✗" }[s] || "○");

  // ── SVG Components ─────────────────────────────────────────
  function ScoreRing({ score, level, size = 140 }) {
    const r = size * 0.385, circ = 2 * Math.PI * r;
    const color = level === "low" ? "#22c55e" : level === "moderate" ? "#f59e0b" : "#ef4444";
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a2a1a" strokeWidth={size*0.086} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.086}
          strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x={size/2} y={size/2-2} textAnchor="middle" fontSize={size*0.19} fontWeight="bold" fill={color}>{score}</text>
        <text x={size/2} y={size/2+size*0.12} textAnchor="middle" fontSize={size*0.072} fill="#6b7280">/ 100</text>
        <text x={size/2} y={size/2+size*0.21} textAnchor="middle" fontSize={size*0.065} fill={color} fontWeight="bold">{level?.toUpperCase()}</text>
      </svg>
    );
  }

  function RadarChart({ dimensions, simDimensions }) {
    const cx = 120, cy = 120, r = 88;
    const labels = ["Account\nTakeover", "Identity\nTheft", "Phishing\nRisk", "Public\nExposure"];
    const angles = [0,1,2,3].map(i => (i * Math.PI * 2 / 4) - Math.PI / 2);
    const vals = dimensions ? [dimensions.takeover, dimensions.theft, dimensions.phishing, dimensions.exposure] : [0,0,0,0];
    const simVals = simDimensions ? [simDimensions.takeover, simDimensions.theft, simDimensions.phishing, simDimensions.exposure] : null;
    const toXY = (angle, val) => ({ x: cx + (val/100)*r*Math.cos(angle), y: cy + (val/100)*r*Math.sin(angle) });
    const gridPts = scale => angles.map(a => `${cx+scale*r*Math.cos(a)},${cy+scale*r*Math.sin(a)}`).join(" ");
    const dataPath = angles.map((a,i) => `${toXY(a,vals[i]).x},${toXY(a,vals[i]).y}`).join(" ");
    const simPath = simVals ? angles.map((a,i) => `${toXY(a,simVals[i]).x},${toXY(a,simVals[i]).y}`).join(" ") : null;
    return (
      <svg width="240" height="240" viewBox="0 0 240 240">
        {[0.25,0.5,0.75,1].map(s => <polygon key={s} points={gridPts(s)} fill="none" stroke="#1e3a2a" strokeWidth="1"/>)}
        {angles.map((a,i) => <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)} stroke="#1e3a2a" strokeWidth="1"/>)}
        <polygon points={dataPath} fill="rgba(0,255,102,0.12)" stroke="#00ff66" strokeWidth="2"/>
        {simPath && <polygon points={simPath} fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2"/>}
        {angles.map((a,i) => {
          const lx = cx+(r+22)*Math.cos(a), ly = cy+(r+22)*Math.sin(a);
          const parts = labels[i].split("\n");
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" fontSize="9" fill="#86efac">
              {parts.map((p,j) => <tspan key={j} x={lx} dy={j===0?"-0.5em":"1.1em"}>{p}</tspan>)}
            </text>
          );
        })}
        {angles.map((a,i) => { const p=toXY(a,vals[i]); return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00ff66"/>; })}
      </svg>
    );
  }

  function TimeSeriesChart({ history }) {
    if (!history?.length) return null;
    const w=420, h=100, pad=32;
    const scores = history.map(h=>h.score);
    const maxS=Math.max(...scores,100), minS=Math.max(0,Math.min(...scores)-10);
    const pts = history.map((h,i)=>({
      x: pad+(i/(history.length-1))*(w-pad*2),
      y: h+(h-h*(h/100))
    }));
    const mapped = history.map((h,i)=>({
      x: pad+(i/(history.length-1))*(w-pad*2),
      y: (1-(h.score-minS)/(maxS-minS))*(h-20)+10
    }));
    const toY = s => (1-(s-minS)/(maxS-minS))*(h-30)+10;
    const linePoints = history.map((h,i)=>`${pad+(i/(history.length-1))*(w-pad*2)},${toY(h.score)}`).join(" ");
    const areaPoints = `${pad},${h-20} ${linePoints} ${pad+(w-pad*2)},${h-20}`;
    const last = history[history.length-1];
    const first = history[0];
    const delta = last.score - first.score;
    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"baseline"}}>
          <span style={{fontSize:10,color:"#4b5563",letterSpacing:2}}>12-MONTH RISK TREND</span>
          <span style={{fontSize:11,color:delta>0?"#ef4444":"#22c55e",fontFamily:"monospace",fontWeight:700}}>{delta>0?"+":""}{delta} pts YoY</span>
        </div>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
          <defs><linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#00ff66" stopOpacity="0.2"/><stop offset="100%" stopColor="#00ff66" stopOpacity="0"/></linearGradient></defs>
          {[25,50,75,100].map(v=>{
            const y=toY(v);
            return y>5&&y<h-22?<line key={v} x1={pad} y1={y} x2={w-pad} y2={y} stroke="#0f2a0f" strokeWidth="1" strokeDasharray="2 4"/>:null;
          })}
          <polygon points={areaPoints} fill="url(#areaGrad)"/>
          <polyline points={linePoints} fill="none" stroke="#00ff66" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
          {history.map((h,i)=>{
            const x=pad+(i/(history.length-1))*(w-pad*2), y=toY(h.score);
            return i%3===0?<circle key={i} cx={x} cy={y} r="3" fill="#00ff66" stroke="#010a01" strokeWidth="1.5"/>:null;
          })}
          {history.filter((_,i)=>i%2===0||i===history.length-1).map((h,ii,arr)=>{
            const origI=history.indexOf(h);
            const x=pad+(origI/(history.length-1))*(w-pad*2);
            return <text key={ii} x={x} y={h-8} textAnchor="middle" fontSize="7" fill="#374151">{h.label}</text>;
          })}
        </svg>
      </div>
    );
  }

  function Timeline({ breaches }) {
    const byYear = {};
    breaches.forEach(b => { const y=new Date(b.breach_date).getFullYear(); byYear[y]=(byYear[y]||0)+1; });
    const years = Object.keys(byYear).sort();
    const max = Math.max(...Object.values(byYear));
    const w=380, h=80, pad=28;
    const bw = Math.floor((w-pad*2)/(years.length+1));
    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
        {years.map((y,i)=>{
          const bh=((byYear[y]/max)*(h-30)), x=pad+i*bw+bw/2;
          return <g key={y}>
            <rect x={x-bw/2+2} y={h-bh-20} width={bw-4} height={bh} fill="#00ff66" opacity="0.7" rx="2"/>
            <text x={x} y={h-5} textAnchor="middle" fontSize="9" fill="#86efac">{y}</text>
            <text x={x} y={h-bh-24} textAnchor="middle" fontSize="9" fill="#00ff66">{byYear[y]}</text>
          </g>;
        })}
      </svg>
    );
  }

  function AttackGraph({ emailStr, breaches }) {
    const nodes = [
      { id:"email", label:emailStr?.split("@")[0]||"you", x:160, y:90, type:"email" },
      ...breaches.slice(0,4).map((b,i)=>({ id:b.id, label:b.breach_name, x:50+i*80, y:200, type:"breach" }))
    ];
    const nm = Object.fromEntries(nodes.map(n=>[n.id,n]));
    return (
      <svg width="100%" viewBox="0 0 340 270">
        {breaches.slice(0,4).map((b,i)=>{
          const f=nm["email"],t=nm[b.id];
          return <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="#1e3a1e" strokeWidth="1.5" strokeDasharray="4 2"/>;
        })}
        {nodes.map(n=>(
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={n.type==="email"?22:16} fill={n.type==="email"?"#052e16":"#1a1a2e"} stroke={n.type==="email"?"#00ff66":"#ef4444"} strokeWidth="1.5"/>
            <text x={n.x} y={n.y+4} textAnchor="middle" fontSize={n.type==="email"?"9":"8"} fill={n.type==="email"?"#00ff66":"#fca5a5"}>{n.label.slice(0,9)}</text>
          </g>
        ))}
        <text x="170" y="262" textAnchor="middle" fontSize="8" fill="#374151">Data exposed in these breaches →</text>
      </svg>
    );
  }

  // ──────────────────────────────────────────────────────────
  // SCREENS
  // ──────────────────────────────────────────────────────────

  if (screen === "landing") return (
    <div style={S.page}>
      <div style={S.scanlines}/>
      <div style={{textAlign:"center",zIndex:1,padding:"40px 20px",maxWidth:580,margin:"0 auto"}}>
        <div style={{fontSize:11,letterSpacing:8,color:"#00ff66",marginBottom:20,opacity:0.7}}>DIGITAL THREAT INTELLIGENCE PLATFORM</div>
        <div style={{fontSize:clamp(48,64,7),fontWeight:900,lineHeight:1,marginBottom:10,fontFamily:"'Courier New',monospace"}}>
          <span style={{color:"#fff"}}>GHOST</span><span style={{color:"#00ff66"}}>SCAN</span>
          <span style={{fontSize:16,color:"#374151",fontWeight:400,marginLeft:8}}>v2</span>
        </div>
        <div style={{fontSize:13,color:"#6b7280",maxWidth:480,margin:"0 auto 12px"}}>
          Identity verification · Breach intelligence · Region-aware legal removal requests
        </div>
        <div style={{fontSize:11,color:"#00ff66",opacity:0.6,marginBottom:32}}>
          GDPR Art.17 · CCPA §1798.105 · LGPD · UK GDPR · PIPEDA · PDPA
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:40}}>
          {["Verified breach data","12 data broker removal","Region-specific law","AI privacy assistant","Time-series tracking","Secure OTP w/ rate limits"].map(f=>(
            <span key={f} style={{background:"#0a1a0a",border:"1px solid #1e3a1e",color:"#86efac",padding:"6px 14px",borderRadius:20,fontSize:11}}>✓ {f}</span>
          ))}
        </div>
        <button onClick={()=>setScreen("email")} style={{...S.btnPrimary,maxWidth:360,margin:"0 auto"}}>
          ⚡ ANALYZE MY DIGITAL EXPOSURE
        </button>
        <div style={{marginTop:16,fontSize:10,color:"#374151"}}>
          No data stored beyond session · Zero biometric retention · Delete anytime
        </div>
      </div>
    </div>
  );

  if (screen === "email") return (
    <div style={S.page}>
      <div style={S.card}>
        <StepIndicator step={1}/>
        <div style={S.cardTitle}>Enter Your Email</div>
        <div style={S.cardSub}>We'll send a secure one-time code to verify ownership</div>
        <input
          style={S.input}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleEmailSubmit()}
          autoFocus
        />
        {DISPOSABLE_DOMAINS.some(d=>email.endsWith("@"+d)) && (
          <div style={{fontSize:11,color:"#f59e0b",marginBottom:8,padding:"6px 10px",background:"#451a03",borderRadius:6}}>⚠ Disposable domain — breach scan will be limited</div>
        )}

        {/* Region selector */}
        <div style={{marginBottom:16}}>
          <label style={{fontSize:11,color:"#4b5563",display:"block",marginBottom:6,letterSpacing:1}}>YOUR REGION / JURISDICTION</label>
          <select
            value={regionKey}
            onChange={e=>setRegionKey(e.target.value)}
            style={{...S.input,marginBottom:0,cursor:"pointer",appearance:"auto"}}
          >
            {REGION_GROUPS.map(g=>(
              <optgroup key={g.group} label={g.group}>
                {g.regions.map(rk=>(
                  <option key={rk} value={rk}>{REGIONS[rk].flag} {REGIONS[rk].label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {regionKey && (
            <div style={{fontSize:10,color:"#4b5563",marginTop:6,padding:"4px 8px",background:"#020d02",borderRadius:4}}>
              Applicable laws: <span style={{color:"#86efac"}}>{region.laws.join(", ")}</span> · Deletion deadline: <span style={{color:"#86efac"}}>{region.deadline} days</span>
            </div>
          )}
        </div>

        <button onClick={handleEmailSubmit} style={{...S.btnPrimary}} disabled={!email.includes("@")}>
          SEND VERIFICATION CODE →
        </button>
        <div style={{fontSize:10,color:"#374151",textAlign:"center",marginTop:4}}>Rate limited · 3 codes per hour · Expires in 10 minutes</div>
      </div>
    </div>
  );

  if (screen === "otp") return (
    <div style={S.page}>
      <div style={S.card}>
        <StepIndicator step={2}/>
        <div style={S.cardTitle}>Verify Your Email</div>
        <div style={S.cardSub}>
          {otpSent ? <><span style={{color:"#00ff66"}}>✓</span> Code sent to <strong style={{color:"#86efac"}}>{email}</strong></> : "Sending secure code…"}
        </div>

        {/* Security indicators */}
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          {["Rate limited","6-digit code","10 min expiry","Max 5 attempts"].map(t=>(
            <span key={t} style={{fontSize:9,color:"#4b5563",background:"#0a1a0a",border:"1px solid #1e3a1e",padding:"2px 7px",borderRadius:10}}>🔒 {t}</span>
          ))}
        </div>

        <div style={{fontSize:10,color:"#374151",marginBottom:10}}>
          Demo mode: code is <span style={{color:"#00ff66",fontFamily:"monospace",fontSize:12}}>{otpCode || "generating…"}</span>
        </div>
        <input
          style={{...S.input,textAlign:"center",letterSpacing:10,fontSize:24,fontFamily:"monospace"}}
          type="text"
          maxLength={6}
          placeholder="______"
          value={otpInput}
          onChange={e=>{ setOtpInput(e.target.value.replace(/\D/g,"")); setOtpError(""); }}
          onKeyDown={e=>e.key==="Enter"&&handleOtpVerify()}
        />
        {otpError && <div style={{fontSize:11,color:"#ef4444",marginBottom:10,padding:"6px 10px",background:"#450a0a",borderRadius:6}}>⚠ {otpError}</div>}
        {otpCountdown > 0 && (
          <div style={{fontSize:10,color:otpCountdown<60?"#f59e0b":"#4b5563",marginBottom:10,textAlign:"center"}}>
            ⏱ Code expires in {Math.floor(otpCountdown/60)}:{String(otpCountdown%60).padStart(2,"0")}
          </div>
        )}
        {otpCountdown === 0 && otpSent && <div style={{fontSize:11,color:"#ef4444",marginBottom:10,textAlign:"center"}}>Code expired.</div>}

        <button onClick={handleOtpVerify} style={S.btnPrimary} disabled={otpInput.length!==6||otpCountdown===0}>VERIFY →</button>
        {otpCountdown===0&&otpSent&&<button onClick={sendOtp} style={S.btnGhost} disabled={otpSending}>{otpSending?"Sending…":"↻ Resend Code"}</button>}
        <button onClick={()=>{setScreen("email");setOtpInput("");setOtpError("");}} style={S.btnGhost}>← Back</button>
      </div>
    </div>
  );

  if (screen === "consent") return (
    <div style={S.page}>
      <div style={S.card}>
        <StepIndicator step={3}/>
        <div style={S.cardTitle}>Privacy Consent</div>
        <div style={S.cardSub}>Applicable laws: <span style={{color:"#86efac"}}>{region.laws.join(", ")}</span></div>
        {[
          {key:"privacy",label:"Privacy Policy",desc:"I accept the privacy policy and data processing terms.",required:true},
          {key:"camera",label:"Camera Access (optional)",desc:"Allow camera for liveness verification to unlock Verified report.",required:false},
          {key:"processing",label:"Data Processing Consent",desc:`I consent to processing my email for breach lookups under ${region.laws.join(", ")}.`,required:true},
        ].map(c=>(
          <div key={c.key} onClick={()=>setConsentChecks(p=>({...p,[c.key]:!p[c.key]}))}
            style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 0",cursor:"pointer",borderBottom:"1px solid #0f2a0f"}}>
            <div style={{width:20,height:20,border:`2px solid ${consentChecks[c.key]?"#00ff66":"#374151"}`,borderRadius:4,flexShrink:0,background:consentChecks[c.key]?"#00ff66":"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,transition:"all 0.15s"}}>
              {consentChecks[c.key]&&<span style={{color:"#000",fontSize:12,fontWeight:"bold"}}>✓</span>}
            </div>
            <div>
              <div style={{fontSize:13,color:"#d1fae5",fontWeight:600}}>{c.label} {c.required&&<span style={{color:"#ef4444",fontSize:10}}>*required</span>}</div>
              <div style={{fontSize:11,color:"#4b5563",marginTop:2}}>{c.desc}</div>
            </div>
          </div>
        ))}
        <button onClick={handleConsentNext} style={{...S.btnPrimary,marginTop:20}} disabled={!consentChecks.privacy||!consentChecks.processing}>
          CONTINUE →
        </button>
      </div>
    </div>
  );

  if (screen === "liveness") return (
    <div style={S.page}>
      <div style={S.card}>
        <StepIndicator step={4}/>
        <div style={S.cardTitle}>Liveness Check</div>
        <div style={S.cardSub}>Confirms you're a real person · No images stored · Anti-spoofing active</div>

        {/* Camera simulation */}
        <div style={{background:"#020d02",border:"2px solid #1e3a1e",borderRadius:12,padding:20,textAlign:"center",marginBottom:20}}>
          <div style={{width:160,height:120,background:"#0a1a0a",borderRadius:8,margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #1e3a1e",position:"relative",overflow:"hidden"}}>
            <div style={{fontSize:40}}>👤</div>
            {/* Scan line animation */}
            {livenessStep>0&&livenessStep<=livenessSteps.length&&(
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"rgba(0,255,102,0.6)",animation:"scanline 1.5s linear infinite"}}/>
            )}
            {livenessStep>0&&livenessStep<=livenessSteps.length&&(
              <div style={{position:"absolute",bottom:4,left:6,right:6,height:3,background:"#0a1a0a",borderRadius:2}}>
                <div style={{height:"100%",background:"#00ff66",width:`${(livenessStep/livenessSteps.length)*100}%`,transition:"width 0.3s",borderRadius:2}}/>
              </div>
            )}
            {livenessStatus==="passed"&&<div style={{position:"absolute",inset:0,background:"rgba(0,255,102,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>✓</div>}
          </div>

          {livenessStep===0&&livenessStatus!=="passed"&&<div style={{color:"#6b7280",fontSize:13}}>Camera ready — awaiting start</div>}
          {livenessStep>0&&livenessStep<=livenessSteps.length&&(
            <div>
              <div style={{color:"#00ff66",fontSize:14,fontWeight:600,marginBottom:4}}>{livenessSteps[livenessStep-1]}</div>
              <div style={{fontSize:11,color:"#4b5563"}}>Step {livenessStep} of {livenessSteps.length}</div>
            </div>
          )}
          {livenessStatus==="passed"&&<div style={{color:"#22c55e",fontSize:16,fontWeight:700}}>✓ Liveness Verified!</div>}
        </div>

        <div style={{fontSize:11,color:"#4b5563",marginBottom:16,padding:"8px 10px",background:"#020d02",borderRadius:6}}>
          🔒 No biometric data is stored. The check runs locally and verifies human presence only. Results are not shared with third parties.
        </div>

        {livenessStep===0&&livenessStatus!=="passed"&&(
          <>
            <button onClick={startLiveness} style={S.btnPrimary}>START LIVENESS CHECK</button>
            <button onClick={skipLiveness} style={S.btnGhost}>Skip → Get limited report</button>
          </>
        )}
        {livenessStep>0&&livenessStatus!=="passed"&&<div style={{textAlign:"center",color:"#4b5563",fontSize:12}}>Follow the on-screen prompts…</div>}
        <style>{`@keyframes scanline{0%{top:0}100%{top:100%}}`}</style>
      </div>
    </div>
  );

  if (screen === "hygiene") return (
    <div style={S.page}>
      <div style={S.card}>
        <StepIndicator step={5}/>
        <div style={S.cardTitle}>Security Hygiene</div>
        <div style={S.cardSub}>These signals improve risk score accuracy</div>
        {[
          {key:"uses2FA",label:"I use two-factor authentication",icon:"🔐",help:"Reduces account takeover risk significantly"},
          {key:"reusesPasswords",label:"I reuse passwords across sites",icon:"⚠️",help:"Password reuse is the #1 breach amplifier"},
          {key:"usesPasswordManager",label:"I use a password manager",icon:"🔑",help:"Reduces reuse risk and phishing vulnerability"},
        ].map(h=>(
          <div key={h.key} onClick={()=>setHygiene(p=>({...p,[h.key]:!p[h.key]}))}
            style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:hygiene[h.key]?"#052e16":"#0a1a0a",borderRadius:8,marginBottom:8,cursor:"pointer",border:`1px solid ${hygiene[h.key]?"#166534":"#1e3a1e"}`,transition:"all 0.15s"}}>
            <span style={{fontSize:20}}>{h.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,color:"#d1fae5"}}>{h.label}</div>
              <div style={{fontSize:10,color:"#4b5563"}}>{h.help}</div>
            </div>
            <div style={{width:44,height:24,background:hygiene[h.key]?"#00ff66":"#1e3a1e",borderRadius:12,position:"relative",transition:"background 0.2s",flexShrink:0}}>
              <div style={{position:"absolute",top:2,left:hygiene[h.key]?22:2,width:20,height:20,background:hygiene[h.key]?"#000":"#374151",borderRadius:"50%",transition:"left 0.2s"}}/>
            </div>
          </div>
        ))}
        <button onClick={runScan} style={{...S.btnPrimary,marginTop:16}}>⚡ RUN SCAN →</button>
      </div>
    </div>
  );

  if (screen === "scanning") return (
    <div style={S.page}>
      <div style={{textAlign:"center",zIndex:1}}>
        <div style={{fontSize:13,color:"#00ff66",letterSpacing:4,marginBottom:24}}>SCANNING</div>
        <div style={{width:80,height:80,border:"3px solid #1e3a1e",borderTop:"3px solid #00ff66",borderRadius:"50%",margin:"0 auto 32px",animation:"spin 1s linear infinite"}}/>
        <div style={{fontSize:15,color:"#86efac",marginBottom:16}}>{scanStage}</div>
        <div style={{width:300,height:4,background:"#1e3a1e",borderRadius:2,margin:"0 auto 8px"}}>
          <div style={{height:"100%",background:"#00ff66",borderRadius:2,width:`${scanProgress}%`,transition:"width 0.4s ease"}}/>
        </div>
        <div style={{fontSize:11,color:"#374151",marginBottom:20}}>{scanProgress}%</div>
        <div style={{fontSize:10,color:"#1e3a1e",maxWidth:300,margin:"0 auto"}}>
          Region: <span style={{color:"#374151"}}>{region.flag} {region.label}</span> · Laws: <span style={{color:"#374151"}}>{region.laws.join(", ")}</span>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // DASHBOARD
  // ════════════════════════════════════════════════════════════
  if (screen === "dashboard" && scanData) {
    const displayScore = simScore&&Object.values(simToggles).some(Boolean)?simScore.finalScore:scanData.finalScore;
    const displayDims = simScore&&Object.values(simToggles).some(Boolean)?simScore.dimensions:scanData.dimensions;
    const displayLevel = simScore&&Object.values(simToggles).some(Boolean)?simScore.level:scanData.level;
    const activeSimToggles = Object.values(simToggles).filter(Boolean).length;
    const scanRegion = REGIONS[scanData.regionKey] || REGIONS["OTHER"];

    return (
      <div style={{...S.page,alignItems:"flex-start",overflowY:"auto",padding:"0 0 60px"}}>
        {/* Notification */}
        {notification && (
          <div style={{position:"fixed",top:20,right:20,background:notification.type==="success"?"#052e16":"#450a0a",border:`1px solid ${notification.type==="success"?"#166534":"#7f1d1d"}`,color:notification.type==="success"?"#86efac":"#fca5a5",padding:"10px 20px",borderRadius:8,zIndex:9999,fontSize:13,fontFamily:"monospace",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
            {notification.msg}
          </div>
        )}

        {/* Header */}
        <div style={{width:"100%",borderBottom:"1px solid #0f2a0f",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#010a01",position:"sticky",top:0,zIndex:100,boxSizing:"border-box",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontFamily:"monospace",fontWeight:900,fontSize:18}}><span style={{color:"#fff"}}>GHOST</span><span style={{color:"#00ff66"}}>SCAN</span></span>
            {scanData.reportType==="verified_full"?(
              <span style={{background:"#052e16",border:"1px solid #166534",color:"#86efac",fontSize:9,padding:"2px 8px",borderRadius:10,letterSpacing:1}}>✓ VERIFIED</span>
            ):(
              <span style={{background:"#451a03",border:"1px solid #92400e",color:"#fcd34d",fontSize:9,padding:"2px 8px",borderRadius:10,letterSpacing:1}}>⚠ LIMITED</span>
            )}
            <span style={{fontSize:10,color:"#374151"}}>{scanRegion.flag} {scanRegion.label}</span>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button onClick={()=>setShowChat(s=>!s)} style={{...S.btnGhost,padding:"7px 12px",fontSize:11,width:"auto",marginBottom:0,color:"#86efac",borderColor:"#1e3a1e"}}>💬 AI Assistant</button>
            <button onClick={()=>setDeletionPanel(true)} style={{...S.btnPrimary,padding:"7px 14px",fontSize:11,width:"auto",marginBottom:0,animation:"pulse 2s ease-in-out infinite"}}>🛡 DATA REMOVAL</button>
            <button onClick={()=>{setScanData(null);setScreen("landing");setEmail("");setOtpInput("");setOtpSent(false);setLivenessStatus("pending");setLivenessStep(0);setHygiene({uses2FA:false,reusesPasswords:true,usesPasswordManager:false});setSimToggles({enable2FA:false,stopReuse:false,removeGravatar:false,usePasswordManager:false});setDeletionStatuses({});}} style={{...S.btnGhost,padding:"7px 12px",fontSize:11,width:"auto",marginBottom:0}}>⟳ New Scan</button>
          </div>
        </div>

        {/* Limited report banner */}
        {scanData.reportType==="limited_fallback"&&(
          <div style={{width:"100%",background:"#451a03",borderBottom:"1px solid #92400e",padding:"10px 20px",display:"flex",alignItems:"center",gap:8,boxSizing:"border-box"}}>
            <span style={{fontSize:15}}>⚠️</span>
            <span style={{fontSize:12,color:"#fcd34d"}}>Limited report — complete liveness verification to unlock Verified badge and higher confidence scoring.</span>
          </div>
        )}

        {/* Nav tabs */}
        <div style={{width:"100%",borderBottom:"1px solid #0f2a0f",background:"#020d02",display:"flex",overflowX:"auto",boxSizing:"border-box"}}>
          {[["overview","📊 Overview"],["timeline","📈 Trends"],["breaches","🔓 Breaches"],["simulator","🧮 Simulator"]].map(([id,label])=>(
            <button key={id} onClick={()=>setActiveView(id)} style={{padding:"10px 18px",background:"none",border:"none",color:activeView===id?"#00ff66":"#4b5563",fontSize:12,cursor:"pointer",borderBottom:activeView===id?"2px solid #00ff66":"2px solid transparent",fontFamily:"monospace",whiteSpace:"nowrap",fontWeight:activeView===id?700:400,flexShrink:0}}>
              {label}
            </button>
          ))}
        </div>

        <div style={{padding:"16px 20px",width:"100%",maxWidth:1200,margin:"0 auto",boxSizing:"border-box"}}>

          {/* OVERVIEW TAB */}
          {activeView==="overview"&&(
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,marginBottom:14}}>
                {/* Score Card */}
                <div style={S.panel}>
                  <div style={S.panelTitle}>RISK OVERVIEW</div>
                  <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                    <ScoreRing score={displayScore} level={displayLevel}/>
                    <div style={{flex:1,minWidth:120}}>
                      <div style={{fontSize:11,color:"#4b5563",marginBottom:4}}>REGION</div>
                      <div style={{fontSize:13,color:"#86efac",marginBottom:10}}>{scanRegion.flag} {scanRegion.label}</div>
                      <div style={{fontSize:11,color:"#4b5563",marginBottom:4}}>APPLICABLE LAWS</div>
                      <div style={{fontSize:11,color:"#00ff66",marginBottom:10}}>{scanRegion.laws.join(", ")}</div>
                      <div style={{fontSize:11,color:"#4b5563",marginBottom:4}}>BREACH VELOCITY</div>
                      <div style={{fontSize:13,color:"#fcd34d"}}>{scanData.velocity} breaches/yr</div>
                    </div>
                  </div>
                  <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {[["Takeover",scanData.dimensions.takeover],["Theft",scanData.dimensions.theft],["Phishing",scanData.dimensions.phishing],["Exposure",scanData.dimensions.exposure]].map(([k,v])=>(
                      <div key={k} style={{background:"#020d02",padding:"6px 8px",borderRadius:6}}>
                        <div style={{fontSize:9,color:"#4b5563"}}>{k.toUpperCase()}</div>
                        <div style={{fontSize:18,fontWeight:"bold",color:v>65?"#ef4444":v>35?"#f59e0b":"#22c55e",fontFamily:"monospace"}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radar */}
                <div style={S.panel}>
                  <div style={S.panelTitle}>EXPOSURE RADAR</div>
                  <div style={{display:"flex",justifyContent:"center"}}>
                    <RadarChart dimensions={scanData.dimensions} simDimensions={activeSimToggles>0?simScore?.dimensions:null}/>
                  </div>
                  {activeSimToggles>0&&<div style={{textAlign:"center",fontSize:10,color:"#6b7280",marginTop:4}}><span style={{color:"#00ff66"}}>─</span> Current &nbsp;<span style={{color:"#3b82f6"}}>- -</span> With mitigations</div>}
                </div>

                {/* Attack Surface */}
                <div style={S.panel}>
                  <div style={S.panelTitle}>ATTACK SURFACE MAP</div>
                  <AttackGraph emailStr={scanData.email} breaches={scanData.breaches}/>
                  <div style={{marginTop:8,fontSize:10,color:"#4b5563"}}>
                    {scanData.breaches.length} breach sources · {new Set(scanData.breaches.flatMap(b=>b.data_classes)).size} data types exposed
                  </div>
                </div>
              </div>

              {/* Quick legal actions */}
              <div style={S.panel}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={S.panelTitle}>QUICK LEGAL ACTIONS</div>
                    <div style={{fontSize:10,color:"#374151"}}>Under {scanRegion.laws.join(", ")} · {scanRegion.deadline}-day deletion deadline · Authority: {scanRegion.authority}</div>
                  </div>
                  <button onClick={()=>setDeletionPanel(true)} style={{...S.btnPrimary,padding:"8px 16px",fontSize:12,width:"auto",marginBottom:0}}>🛡 Full Removal Center →</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
                  {scanData.breaches.slice(0,3).map(b=>{
                    const tmpl=generateDeletionEmail({userEmail:scanData.email,targetName:b.breach_name,targetEmail:b.privacyEmail,regionKey:scanData.regionKey,dataClasses:b.data_classes,breachDate:b.breach_date,requestType:"breach_notification_erasure"});
                    return (
                      <div key={b.id} style={{background:"#0a1a0a",border:"1px solid #1e3a1e",borderRadius:8,padding:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                          <div style={{fontSize:12,color:"#86efac",fontWeight:600}}>{b.breach_name}</div>
                          <span style={{fontSize:9,color:b.confidence==="verified"?"#22c55e":"#f59e0b",background:"#0a1a0a",border:`1px solid ${b.confidence==="verified"?"#166534":"#92400e"}`,padding:"1px 5px",borderRadius:3}}>{b.confidence}</span>
                        </div>
                        <div style={{fontSize:10,color:"#4b5563",marginBottom:8}}>{b.data_classes?.slice(0,2).join(", ")}</div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          <a href={generateMailtoLink(b.privacyEmail,tmpl.subject,tmpl.body)} onClick={()=>markStatus(b.id,"sent")} style={{...S.btnSmall,textDecoration:"none",fontSize:10}}>✉ Email</a>
                          <button onClick={()=>{downloadTxt(tmpl.filename,`${tmpl.subject}\n\n${tmpl.body}`);markStatus(b.id,"sent");}} style={{...S.btnSmall,fontSize:10}}>↓ .txt</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{marginTop:10,fontSize:10,color:"#374151",padding:"8px 10px",background:"#020d02",borderRadius:6}}>
                  ⚠ Templates are informational only and do not constitute legal advice. Consult a qualified attorney for advice specific to your situation.
                </div>
              </div>
            </>
          )}

          {/* TIMELINE TAB */}
          {activeView==="timeline"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={S.panel}>
                <div style={S.panelTitle}>RISK SCORE — 12-MONTH TREND</div>
                <TimeSeriesChart history={scanData.history}/>
                <div style={{marginTop:12,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
                  {[
                    {label:"Current Score",val:scanData.finalScore,color:scanData.level==="high"?"#ef4444":scanData.level==="moderate"?"#f59e0b":"#22c55e"},
                    {label:"12-Month High",val:Math.max(...scanData.history.map(h=>h.score)),color:"#ef4444"},
                    {label:"12-Month Low",val:Math.min(...scanData.history.map(h=>h.score)),color:"#22c55e"},
                    {label:"Avg Score",val:Math.round(scanData.history.reduce((a,h)=>a+h.score,0)/scanData.history.length),color:"#f59e0b"},
                  ].map(s=>(
                    <div key={s.label} style={{background:"#020d02",padding:"10px 12px",borderRadius:8,border:"1px solid #1e3a1e"}}>
                      <div style={{fontSize:9,color:"#4b5563",marginBottom:4}}>{s.label}</div>
                      <div style={{fontSize:24,fontWeight:900,color:s.color,fontFamily:"monospace"}}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={S.panel}>
                <div style={S.panelTitle}>BREACH TIMELINE</div>
                <Timeline breaches={scanData.breaches}/>
                <div style={{marginTop:10,fontSize:11,color:"#4b5563"}}>
                  Breach frequency: <span style={{color:"#f59e0b"}}>{scanData.velocity} per year</span> · Trend: <span style={{color:"#ef4444"}}>↑ {scanData.trend}</span>
                </div>
              </div>
              <div style={S.panel}>
                <div style={S.panelTitle}>EXPOSURE PREDICTION</div>
                <div style={{fontSize:12,color:"#6b7280",marginBottom:10}}>Based on current trajectory and industry averages</div>
                {[
                  {period:"Next 6 months",prediction:"Moderate probability of 1 new breach exposure",risk:"moderate"},
                  {period:"Next 12 months",prediction:"High probability of credential stuffing attempt if passwords reused",risk:"high"},
                  {period:"Next 24 months",prediction:"Significant identity theft risk if removal requests not actioned",risk:"high"},
                ].map(p=>(
                  <div key={p.period} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid #0f2a0f",alignItems:"flex-start"}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:p.risk==="high"?"#ef4444":"#f59e0b",flexShrink:0,marginTop:3}}/>
                    <div>
                      <div style={{fontSize:11,color:"#86efac",fontWeight:600}}>{p.period}</div>
                      <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{p.prediction}</div>
                    </div>
                  </div>
                ))}
                <div style={{marginTop:10,fontSize:10,color:"#374151"}}>Predictions are probabilistic estimates based on exposure patterns — not guarantees.</div>
              </div>
            </div>
          )}

          {/* BREACHES TAB */}
          {activeView==="breaches"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:4}}>
                <div style={{...S.panel,textAlign:"center"}}>
                  <div style={{fontSize:38,fontWeight:900,color:"#ef4444",fontFamily:"monospace"}}>{scanData.breaches.length}</div>
                  <div style={{fontSize:10,color:"#6b7280"}}>Breaches Found</div>
                </div>
                <div style={{...S.panel,textAlign:"center"}}>
                  <div style={{fontSize:38,fontWeight:900,color:"#f59e0b",fontFamily:"monospace"}}>{new Set(scanData.breaches.flatMap(b=>b.data_classes)).size}</div>
                  <div style={{fontSize:10,color:"#6b7280"}}>Data Types Exposed</div>
                </div>
                <div style={{...S.panel,textAlign:"center"}}>
                  <div style={{fontSize:38,fontWeight:900,color:"#86efac",fontFamily:"monospace"}}>{scanData.breaches.filter(b=>b.confidence==="verified").length}</div>
                  <div style={{fontSize:10,color:"#6b7280"}}>Verified Breaches</div>
                </div>
              </div>
              {scanData.breaches.map(b=>{
                const tmpl=generateDeletionEmail({userEmail:scanData.email,targetName:b.breach_name,targetEmail:b.privacyEmail,regionKey:scanData.regionKey,dataClasses:b.data_classes,breachDate:b.breach_date,requestType:"breach_notification_erasure"});
                const st=deletionStatuses[b.id];
                return (
                  <div key={b.id} style={{...S.panel,border:`1px solid ${st?.status==="deleted"?"#166534":st?.status==="sent"?"#1e3a1e":"#1e3a1e"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:10}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <span style={{fontSize:16,color:"#d1fae5",fontWeight:700}}>{b.breach_name}</span>
                          <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:b.confidence==="verified"?"#052e16":"#1a1a0a",border:`1px solid ${b.confidence==="verified"?"#166534":"#374151"}`,color:b.confidence==="verified"?"#22c55e":"#f59e0b"}}>
                            {b.confidence==="verified"?"✓ VERIFIED":"UNCONFIRMED"}
                          </span>
                          <span style={{fontSize:9,color:"#4b5563",background:"#0a1a0a",padding:"2px 7px",borderRadius:10}}>{b.source}</span>
                        </div>
                        <div style={{fontSize:11,color:"#4b5563",marginTop:4}}>{b.breach_domain} · {new Date(b.breach_date).toLocaleDateString()} · {(b.pwn_count/1e6).toFixed(1)}M records</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:13,color:statusColor(st?.status||"pending")}}>{statusIcon(st?.status||"pending")} {(st?.status||"pending").toUpperCase()}</div>
                        {st?.date&&<div style={{fontSize:9,color:"#374151"}}>{st.date}</div>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
                      {b.data_classes.map(d=>(
                        <span key={d} style={{fontSize:10,color:"#fca5a5",background:"#1a1a2e",border:"1px solid #374151",padding:"2px 8px",borderRadius:10}}>{d}</span>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <a href={generateMailtoLink(b.privacyEmail,tmpl.subject,tmpl.body)} onClick={()=>markStatus(b.id,"sent")} style={{...S.btnSmall,textDecoration:"none",fontSize:11}}>✉ Open in Mail</a>
                      <button onClick={()=>{downloadEml(tmpl.filename,b.privacyEmail,tmpl.subject,tmpl.body);markStatus(b.id,"sent");}} style={{...S.btnSmall,fontSize:11}}>↓ .eml</button>
                      <button onClick={()=>{downloadTxt(tmpl.filename,`${tmpl.subject}\n\n${tmpl.body}`);markStatus(b.id,"sent");}} style={{...S.btnSmall,fontSize:11}}>↓ .txt</button>
                      {st?.status&&<>
                        {["sent","deleted","failed"].map(s=>(
                          <button key={s} onClick={()=>markStatus(b.id,s)} style={{...S.btnSmall,fontSize:10,border:`1px solid ${statusColor(s)}`,color:statusColor(s),background:st.status===s?"#052e16":"transparent"}}>
                            {s}
                          </button>
                        ))}
                      </>}
                    </div>
                  </div>
                );
              })}
              <div style={{fontSize:10,color:"#374151",padding:"10px 12px",background:"#020d02",borderRadius:8,border:"1px solid #0f2a0f"}}>
                📋 Data source: {scanData.dataSourceNote}
              </div>
            </div>
          )}

          {/* SIMULATOR TAB */}
          {activeView==="simulator"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
              <div style={S.panel}>
                <div style={S.panelTitle}>MITIGATION SIMULATOR</div>
                <div style={{fontSize:11,color:"#4b5563",marginBottom:14}}>Toggle actions to see projected score improvement</div>
                {scoreDelta>0&&(
                  <div style={{background:"#052e16",border:"1px solid #166534",borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#86efac"}}>Projected improvement</span>
                    <span style={{fontSize:24,fontWeight:900,color:"#22c55e",fontFamily:"monospace"}}>-{scoreDelta} pts</span>
                  </div>
                )}
                {[
                  {key:"enable2FA",label:"Enable Two-Factor Auth",impact:"-8 to -12 pts",icon:"🔐",detail:"Prevents 99% of automated account takeovers"},
                  {key:"stopReuse",label:"Stop Password Reuse",impact:"-10 to -15 pts",icon:"🔄",detail:"Limits breach impact to the specific service"},
                  {key:"removeGravatar",label:"Remove Gravatar Profile",impact:"-5 to -8 pts",icon:"👤",detail:"Reduces public exposure and phishing surface"},
                  {key:"usePasswordManager",label:"Use Password Manager",impact:"-5 to -10 pts",icon:"🔑",detail:"1Password, Bitwarden (open source), or Dashlane"},
                ].map(t=>(
                  <div key={t.key} onClick={()=>setSimToggles(p=>({...p,[t.key]:!p[t.key]}))}
                    style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 12px",background:simToggles[t.key]?"#052e16":"#0a1a0a",borderRadius:8,marginBottom:8,cursor:"pointer",border:`1px solid ${simToggles[t.key]?"#166534":"#1e3a1e"}`,transition:"all 0.15s"}}>
                    <span style={{fontSize:20,flexShrink:0}}>{t.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,color:"#d1fae5",fontWeight:600}}>{t.label}</div>
                      <div style={{fontSize:10,color:"#4b5563"}}>{t.impact} · {t.detail}</div>
                    </div>
                    <div style={{width:40,height:22,background:simToggles[t.key]?"#00ff66":"#1e3a1e",borderRadius:11,position:"relative",transition:"background 0.2s",flexShrink:0,marginTop:2}}>
                      <div style={{position:"absolute",top:2,left:simToggles[t.key]?20:2,width:18,height:18,background:simToggles[t.key]?"#000":"#374151",borderRadius:"50%",transition:"left 0.2s"}}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={S.panel}>
                <div style={S.panelTitle}>SCORE COMPARISON</div>
                {simScore?(
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div style={{background:"#0a1a0a",padding:"16px",borderRadius:8,textAlign:"center",border:"1px solid #1e3a1e"}}>
                        <div style={{fontSize:10,color:"#4b5563",marginBottom:6}}>CURRENT RISK</div>
                        <ScoreRing score={scanData.finalScore} level={scanData.level} size={110}/>
                      </div>
                      <div style={{background:"#052e16",padding:"16px",borderRadius:8,textAlign:"center",border:"1px solid #166534"}}>
                        <div style={{fontSize:10,color:"#4b5563",marginBottom:6}}>PROJECTED</div>
                        <ScoreRing score={simScore.finalScore} level={simScore.level} size={110}/>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {[["Takeover",scanData.dimensions.takeover,simScore.dimensions.takeover],["Theft",scanData.dimensions.theft,simScore.dimensions.theft],["Phishing",scanData.dimensions.phishing,simScore.dimensions.phishing],["Exposure",scanData.dimensions.exposure,simScore.dimensions.exposure]].map(([k,cur,sim])=>(
                        <div key={k} style={{background:"#020d02",padding:"8px 10px",borderRadius:6}}>
                          <div style={{fontSize:9,color:"#4b5563",marginBottom:4}}>{k.toUpperCase()}</div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:16,fontWeight:900,color:"#ef4444",fontFamily:"monospace"}}>{cur}</span>
                            <span style={{fontSize:11,color:"#374151"}}>→</span>
                            <span style={{fontSize:16,fontWeight:900,color:"#22c55e",fontFamily:"monospace"}}>{sim}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <RadarChart dimensions={scanData.dimensions} simDimensions={simScore.dimensions}/>
                    <div style={{textAlign:"center",fontSize:10,color:"#6b7280"}}><span style={{color:"#00ff66"}}>─</span> Current &nbsp;<span style={{color:"#3b82f6"}}>- -</span> With mitigations</div>
                  </div>
                ):(
                  <div style={{textAlign:"center",color:"#374151",fontSize:13,padding:30}}>Toggle mitigations on the left to see projected improvements</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Chat bubble */}
        {!showChat&&(
          <button onClick={()=>setShowChat(true)} style={{position:"fixed",bottom:24,right:24,width:52,height:52,borderRadius:"50%",background:"#00ff66",border:"none",cursor:"pointer",fontSize:22,zIndex:1900,boxShadow:"0 0 20px rgba(0,255,102,0.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            💬
          </button>
        )}
        {showChat&&<AIChatAssistant scanData={scanData} regionKey={scanData.regionKey} onClose={()=>setShowChat(false)}/>}

        {/* ══════════════════════════════════════════════════════
            DATA REMOVAL CENTER PANEL
        ══════════════════════════════════════════════════════ */}
        {deletionPanel&&(
          <div style={{position:"fixed",inset:0,zIndex:1000}}>
            <div onClick={()=>{setDeletionPanel(false);setEmailPreview(null);}} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)"}}/>
            <div style={{position:"absolute",right:0,top:0,bottom:0,width:"min(780px,100vw)",background:"#010a01",borderLeft:"1px solid #1e3a1e",display:"flex",flexDirection:"column",overflow:"hidden"}}>
              {/* Panel header */}
              <div style={{padding:"16px 20px",borderBottom:"1px solid #0f2a0f",background:"#020d02"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:900,fontFamily:"monospace",marginBottom:4}}><span style={{color:"#00ff66"}}>🛡</span> DATA REMOVAL CENTER</div>
                    <div style={{fontSize:11,color:"#4b5563"}}>
                      {Object.values(deletionStatuses).filter(s=>s.status==="sent"||s.status==="deleted").length} sent · {allTargets.length} targets · Region: {scanRegion.flag} {scanRegion.label} · {scanRegion.laws.join(", ")}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <button onClick={sendAll} style={{...S.btnPrimary,padding:"8px 14px",fontSize:11,width:"auto",marginBottom:0}}>⚡ Queue All</button>
                    <button onClick={()=>{setDeletionPanel(false);setEmailPreview(null);}} style={{...S.btnGhost,padding:"6px 12px",fontSize:18,width:"auto",marginBottom:0,lineHeight:1}}>✕</button>
                  </div>
                </div>
                {/* Progress */}
                <div style={{marginTop:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:10,color:"#4b5563"}}>
                    <span>Removal Progress</span>
                    <span>{Math.round((Object.values(deletionStatuses).filter(s=>s.status==="deleted").length/allTargets.length)*100)}% complete</span>
                  </div>
                  <div style={{height:5,background:"#1e3a1e",borderRadius:3}}>
                    <div style={{height:"100%",background:"linear-gradient(90deg,#00ff66,#22c55e)",borderRadius:3,width:`${(Object.values(deletionStatuses).filter(s=>s.status==="deleted").length/allTargets.length)*100}%`,transition:"width 0.3s"}}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
                  {[["pending","Not started"],["queued","Queued"],["sent","Email sent"],["deleted","Confirmed deleted"],["failed","No response"]].map(([s,l])=>(
                    <div key={s} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#6b7280"}}>
                      <span style={{color:statusColor(s)}}>●</span>{l}
                    </div>
                  ))}
                </div>
                {/* NOTE about send-only-when-confirmed */}
                <div style={{marginTop:8,fontSize:10,color:"#374151",padding:"6px 8px",background:"#020d02",borderRadius:4,border:"1px solid #0f2a0f"}}>
                  ℹ Status is only updated to "sent" after you open and confirm sending via your mail client or the opt-out portal.
                </div>
              </div>

              <div style={{flex:1,overflow:"auto",display:"flex"}}>
                {/* Target list */}
                <div style={{flex:emailPreview?"0 0 340px":1,overflow:"auto",borderRight:emailPreview?"1px solid #0f2a0f":"none",minWidth:0}}>
                  {/* Tabs */}
                  <div style={{display:"flex",borderBottom:"1px solid #0f2a0f",background:"#020d02"}}>
                    {[["brokers",`Data Brokers (${brokerTargets.length})`],["breaches",`Breached Services (${breachTargets.length})`]].map(([tab,label])=>(
                      <button key={tab} onClick={()=>setActiveTab(tab)} style={{flex:1,padding:"11px 8px",background:"none",border:"none",color:activeTab===tab?"#00ff66":"#4b5563",fontSize:12,cursor:"pointer",borderBottom:activeTab===tab?"2px solid #00ff66":"2px solid transparent",fontFamily:"monospace",fontWeight:activeTab===tab?700:400}}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {(activeTab==="brokers"?brokerTargets:breachTargets).map(target=>{
                    const st=deletionStatuses[target.id];
                    const isSelected=selectedTarget?.id===target.id;
                    return (
                      <div key={target.id}
                        style={{padding:"12px 14px",borderBottom:"1px solid #0a1a0a",background:isSelected?"#052e16":"transparent",cursor:"pointer",borderLeft:`3px solid ${isSelected?"#00ff66":"transparent"}`,transition:"all 0.1s"}}
                        onClick={()=>openEmailPreview(target)}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
                              <span style={{fontSize:13,color:"#d1fae5",fontWeight:600}}>{target.name}</span>
                              <span style={{fontSize:9,color:"#4b5563",background:"#0a1a0a",padding:"1px 5px",borderRadius:3}}>{target.category}</span>
                              {target.confidence&&<span style={{fontSize:9,color:target.confidence==="high"?"#22c55e":"#f59e0b"}}>{target.confidence==="high"?"●":"◐"}</span>}
                            </div>
                            <div style={{fontSize:10,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{target.privacyEmail}</div>
                            {target.dataSource&&<div style={{fontSize:9,color:"#1e3a1e",marginTop:1}}>{target.dataSource}</div>}
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontSize:13,color:statusColor(st?.status||"pending")}}>{statusIcon(st?.status||"pending")}</div>
                            <div style={{fontSize:9,color:statusColor(st?.status||"pending")}}>{(st?.status||"pending").toUpperCase()}</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
                          {target.privacyEmail&&(()=>{
                            const tmpl=generateDeletionEmail({userEmail:scanData.email,targetName:target.name,targetEmail:target.privacyEmail,regionKey:scanData.regionKey,dataClasses:target.breach?.data_classes,breachDate:target.breach?.breach_date,requestType:target.type==="breach"?"breach_notification_erasure":undefined});
                            return (
                              <>
                                <a href={generateMailtoLink(target.privacyEmail,tmpl.subject,tmpl.body)}
                                  onClick={()=>markStatus(target.id,"sent")}
                                  style={{...S.btnSmall,textDecoration:"none",fontSize:10}}>✉ Mail</a>
                                <button onClick={()=>{downloadEml(tmpl.filename,target.privacyEmail,tmpl.subject,tmpl.body);markStatus(target.id,"sent");}} style={{...S.btnSmall,fontSize:10}}>↓ .eml</button>
                              </>
                            );
                          })()}
                          {target.privacyUrl&&(
                            <a href={target.privacyUrl} target="_blank" rel="noopener noreferrer"
                              onClick={()=>markStatus(target.id,"sent")}
                              style={{...S.btnSmall,textDecoration:"none",fontSize:10,background:"#0f2a0f"}}>🌐 Portal</a>
                          )}
                        </div>
                        {st?.status&&st.status!=="pending"&&(
                          <div style={{display:"flex",gap:4,marginTop:6}} onClick={e=>e.stopPropagation()}>
                            {["sent","deleted","failed"].map(s=>(
                              <button key={s} onClick={()=>markStatus(target.id,s)}
                                style={{fontSize:9,padding:"2px 6px",background:st.status===s?"#052e16":"#0a1a0a",border:`1px solid ${statusColor(s)}`,color:statusColor(s),borderRadius:4,cursor:"pointer",fontFamily:"monospace"}}>
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Email preview pane */}
                {emailPreview&&(
                  <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
                    <div style={{padding:"12px 14px",borderBottom:"1px solid #0f2a0f",background:"#020d02",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:13,color:"#86efac",fontWeight:600}}>{emailPreview.target.name}</div>
                        <div style={{fontSize:10,color:"#4b5563"}}>{emailPreview.template.laws} · {emailPreview.template.deadline}-day deadline</div>
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                        <span style={{fontSize:9,background:"#0f2a0f",padding:"2px 7px",borderRadius:8,color:"#00ff66",fontFamily:"monospace"}}>{emailPreview.template.refId}</span>
                        <button onClick={()=>{setEmailPreview(null);setSelectedTarget(null);}} style={{...S.btnGhost,padding:"3px 8px",fontSize:12,width:"auto",marginBottom:0}}>✕</button>
                      </div>
                    </div>

                    {/* Regime selector */}
                    <div style={{padding:"8px 14px",borderBottom:"1px solid #0f2a0f",display:"flex",gap:6,background:"#020d02",alignItems:"center"}}>
                      <span style={{fontSize:9,color:"#4b5563",marginRight:4}}>TEMPLATE:</span>
                      {emailPreview.target.regime?.map(r=>(
                        <button key={r} onClick={()=>{
                          const tmpl=generateDeletionEmail({userEmail:scanData.email,targetName:emailPreview.target.name,targetEmail:emailPreview.target.privacyEmail,regionKey:r==="gdpr"?"EU-OTHER":scanData.regionKey,dataClasses:emailPreview.target.breach?.data_classes,breachDate:emailPreview.target.breach?.breach_date,requestType:emailPreview.target.type==="breach"?"breach_notification_erasure":undefined});
                          setEmailPreview(prev=>({...prev,template:tmpl,effectiveRegime:r}));
                        }}
                          style={{...S.btnSmall,fontSize:10,background:emailPreview.effectiveRegime===r?"#052e16":"#0a1a0a",border:`1px solid ${emailPreview.effectiveRegime===r?"#166534":"#1e3a1e"}`}}>
                          {r.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <div style={{padding:"10px 14px",borderBottom:"1px solid #0f2a0f",background:"#020d02"}}>
                      <div style={{fontSize:9,color:"#4b5563",marginBottom:2}}>TO</div>
                      <div style={{fontSize:11,color:"#86efac",fontFamily:"monospace"}}>{emailPreview.target.privacyEmail}</div>
                      <div style={{fontSize:9,color:"#4b5563",marginTop:6,marginBottom:2}}>SUBJECT</div>
                      <div style={{fontSize:10,color:"#d1fae5",fontFamily:"monospace",lineHeight:1.4}}>{emailPreview.template.subject}</div>
                    </div>

                    <div style={{flex:1,overflow:"auto",padding:"12px 14px"}}>
                      <pre style={{fontFamily:"monospace",fontSize:10,color:"#9ca3af",lineHeight:1.6,whiteSpace:"pre-wrap",margin:0}}>
                        {emailPreview.template.body}
                      </pre>
                    </div>

                    <div style={{padding:"10px 14px",borderTop:"1px solid #0f2a0f",background:"#020d02",display:"flex",gap:6,flexWrap:"wrap"}}>
                      <a href={generateMailtoLink(emailPreview.target.privacyEmail,emailPreview.template.subject,emailPreview.template.body)}
                        onClick={()=>markStatus(emailPreview.target.id,"sent")}
                        style={{...S.btnPrimary,textDecoration:"none",fontSize:11,padding:"9px 14px",width:"auto",marginBottom:0}}>
                        ✉ Open in Mail
                      </a>
                      <button onClick={()=>{downloadEml(emailPreview.template.filename,emailPreview.target.privacyEmail,emailPreview.template.subject,emailPreview.template.body);markStatus(emailPreview.target.id,"sent");showNotif(".eml downloaded");}}
                        style={{...S.btnGhost,fontSize:11,padding:"9px 14px",width:"auto",marginBottom:0}}>↓ .eml</button>
                      <button onClick={()=>{downloadTxt(emailPreview.template.filename,`To: ${emailPreview.target.privacyEmail}\nSubject: ${emailPreview.template.subject}\n\n${emailPreview.template.body}`);markStatus(emailPreview.target.id,"sent");showNotif(".txt downloaded");}}
                        style={{...S.btnGhost,fontSize:11,padding:"9px 14px",width:"auto",marginBottom:0}}>↓ .txt</button>
                      <button onClick={()=>{navigator.clipboard?.writeText(`To: ${emailPreview.target.privacyEmail}\nSubject: ${emailPreview.template.subject}\n\n${emailPreview.template.body}`);showNotif("Copied!");}}
                        style={{...S.btnGhost,fontSize:11,padding:"9px 14px",width:"auto",marginBottom:0}}>📋 Copy</button>
                      {emailPreview.target.privacyUrl&&(
                        <a href={emailPreview.target.privacyUrl} target="_blank" rel="noopener noreferrer"
                          style={{...S.btnGhost,textDecoration:"none",fontSize:11,padding:"9px 14px",width:"auto",marginBottom:0,background:"#0f2a0f"}}>🌐 Portal</a>
                      )}
                    </div>
                    <div style={{padding:"6px 14px",fontSize:9,color:"#374151",borderTop:"1px solid #0a1a0a"}}>
                      ⚠ Informational only — not legal advice · Status updated only when you confirm the action was completed
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,255,102,0.3)}50%{box-shadow:0 0 0 6px rgba(0,255,102,0)}}`}</style>
      </div>
    );
  }

  return <div style={S.page}><div style={{color:"#00ff66"}}>Loading…</div></div>;
}

function clamp(min, max, vwFactor) { return `clamp(${min}px, ${vwFactor}vw, ${max}px)`; }

function StepIndicator({ step }) {
  const steps = ["Email","OTP","Consent","Liveness","Hygiene"];
  return (
    <div style={{display:"flex",gap:6,marginBottom:24,justifyContent:"center"}}>
      {steps.map((s,i)=>(
        <div key={s} style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:i+1<step?"#166534":i+1===step?"#00ff66":"#1e3a1e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:i+1===step?"#000":i+1<step?"#86efac":"#4b5563",fontWeight:"bold",transition:"all 0.2s"}}>
            {i+1<step?"✓":i+1}
          </div>
          {i<steps.length-1&&<div style={{width:16,height:1,background:i+1<step?"#166534":"#1e3a1e"}}/>}
        </div>
      ))}
    </div>
  );
}

const S = {
  page: { minHeight:"100vh", background:"#010a01", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Courier New',monospace", color:"#d1fae5", position:"relative", overflow:"hidden" },
  scanlines: { position:"fixed", inset:0, pointerEvents:"none", zIndex:0, background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,102,0.008) 2px,rgba(0,255,102,0.008) 4px)" },
  card: { background:"#020d02", border:"1px solid #1e3a1e", borderRadius:12, padding:"28px 24px", width:"100%", maxWidth:440, zIndex:1, boxShadow:"0 0 40px rgba(0,255,102,0.05)", margin:"20px" },
  cardTitle: { fontSize:22, fontWeight:900, color:"#fff", marginBottom:6 },
  cardSub: { fontSize:12, color:"#4b5563", marginBottom:18 },
  input: { width:"100%", background:"#010a01", border:"1px solid #1e3a1e", borderRadius:8, padding:"11px 13px", color:"#d1fae5", fontSize:13, fontFamily:"monospace", marginBottom:10, outline:"none", boxSizing:"border-box" },
  btnPrimary: { width:"100%", background:"#00ff66", color:"#000", border:"none", borderRadius:8, padding:"12px 20px", fontSize:13, fontWeight:900, fontFamily:"monospace", cursor:"pointer", letterSpacing:1, marginBottom:8, transition:"opacity 0.15s", display:"block" },
  btnGhost: { width:"100%", background:"transparent", color:"#4b5563", border:"1px solid #1e3a1e", borderRadius:8, padding:"10px 20px", fontSize:12, fontFamily:"monospace", cursor:"pointer", marginBottom:8, display:"block" },
  btnSmall: { background:"#0a1a0a", color:"#86efac", border:"1px solid #1e3a1e", borderRadius:6, padding:"4px 10px", fontSize:11, fontFamily:"monospace", cursor:"pointer" },
  panel: { background:"#020d02", border:"1px solid #1e3a1e", borderRadius:10, padding:16 },
  panelTitle: { fontSize:10, letterSpacing:3, color:"#4b5563", marginBottom:12, fontWeight:700 },
};
// end of file