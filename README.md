# 👻 GhostScan — Digital Exposure & Data Removal Platform

> **Hackathon MVP** · Built for: Full feature push · Verified email + liveness · HIBP breach intelligence · Multi-dimensional risk scoring · Rocket Money-style Data Removal Center

---

## 🚀 Demo Flow (under 2 minutes)

1. **Landing** → Click "Analyze My Digital Exposure"
2. **Email** → Enter your email (or use `demo@gmail.com`)
3. **OTP** → Enter `123456` (demo mode)
4. **Consent** → Check privacy + processing
5. **Liveness** → Click "Start" and follow the prompts (or skip for limited report)
6. **Hygiene** → Toggle security habits
7. **Dashboard** → Full risk report with 4 panels
8. **🛡 Data Removal Center** → Click the glowing green button → see all 47 brokers + breached services → click "Open in Mail" to send pre-filled deletion emails

---

## 🎯 Key Features

### Data Removal Center (Rocket Money-style)
- **47 data brokers** listed with contact info, opt-out portals, and supported regimes
- **Per-breach erasure** requests pre-filled with exact data classes exposed
- **One-click email**: Opens `mailto:` with pre-filled GDPR/CCPA legal text — just hit Send
- **Download .eml**: Double-click to open in Outlook, Apple Mail, Thunderbird
- **Download .txt**: Plain text version for any workflow
- **Status tracker**: Pending → Queued → Sent → Awaiting Response → Deleted / Failed
- **Auto-escalation**: 30-day reminder if no response
- **"Send All"**: Queue requests to all targets in one click
- **Online portals**: Direct links to broker opt-out pages when available

### Legal Templates
- **GDPR Article 17** — Right to Erasure with full Art.17(1) grounds
- **CCPA §1798.105** — California deletion request with CPRA amendments
- **Breach Erasure** — Combined GDPR Art.17/33/34 + CCPA §1798.150 for data breaches
- Unique reference IDs for tracking (`GS-XXXXXXXX-XXXX`)
- Disclaimer: *"Informational template only — not legal advice"*

### Risk Engine
- 4 dimensions: Account Takeover, Identity Theft, Phishing Risk, Public Exposure
- Weighted final score: `0.35T + 0.25I + 0.20P + 0.20E`
- Coverage-based confidence: Low / Medium / High
- Liveness-gated: Full "Verified" report or limited fallback

---

## 📦 Setup

### 1. Prerequisites
```bash
node >= 18
npm >= 9
```

### 2. Install
```bash
npm install
```

### 3. Environment Variables
```bash
cp .env.local.example .env.local
# Edit .env.local with your keys
```

**Required for production:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Optional (app runs in mock mode without these):**
- `HIBP_API_KEY` — Get at https://haveibeenpwned.com/API/Key (~$3.50/month)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — Free tier at https://upstash.com

### 4. Database
Run `supabase/schema.sql` in your Supabase project SQL editor.

### 5. Run
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🧪 Tests
```bash
npm test
```
Covers: risk engine scoring, clamp behavior, confidence boundaries, velocity, trend, simulation.

---

## 🏗 Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── scans/route.ts              # POST scan, GET history
│   │   ├── scans/[id]/legal/route.ts   # GET legal email (JSON|EML|TXT)
│   │   ├── deletion-requests/route.ts  # GET/POST deletion tracker
│   │   ├── deletion-requests/[id]/route.ts  # PATCH status
│   │   └── internal/purge-expired/route.ts  # Cron purge
│   └── ...
├── lib/
│   ├── risk-engine.ts          # Pure scoring logic
│   ├── legal-templates.ts      # GDPR/CCPA/Breach email templates
│   ├── data-brokers.ts         # 47-broker registry
│   ├── hibp.ts                 # HIBP adapter + mock fallback
│   └── __tests__/              # Jest unit tests
└── ...
```

---

## 💳 API Cost Notes

| Service | Cost | Notes |
|---------|------|-------|
| HIBP | ~$3.50/month | Free for personal use; app mocks without key |
| Supabase | Free tier | 500MB DB, 50K MAU |
| Upstash Redis | Free tier | 10K req/day for rate limiting |
| Vercel | Free tier | Hobby plan sufficient for hackathon |

**Total hackathon cost: ~$0–$3.50/month**

---

## 🔒 Security & Compliance

- ✅ OTP auth mandatory for all scans
- ✅ Rate limiting: 5 scans/hour/user, 20/day/IP
- ✅ RLS: users can only access their own data
- ✅ No face images stored — liveness frames are in-memory only
- ✅ No biometric embeddings
- ✅ HIBP key server-side only (never in client bundle)
- ✅ Email hashed in logs, never raw
- ✅ 30-day data retention with user delete-now
- ✅ Legal templates include mandatory disclaimer

---

## 📋 Acceptance Checklist

- [x] OTP flow + scan from verified inbox
- [x] Liveness challenge → Verified badge
- [x] 4 dashboard panels (Overview, Breakdown, Attack Map, Simulator)
- [x] Real-time score update on mitigation toggles
- [x] GDPR/CCPA templates generate with copy/download
- [x] No face images persisted
- [x] Rate limiting on scan endpoint
- [x] Data Removal Center with per-target legal emails
- [x] .eml + .txt + mailto download options
- [x] Status tracking per target (pending → deleted)
- [x] Auto-escalation after 30 days
- [x] Purge endpoint + Vercel cron configured
- [x] Delete all data endpoint
- [x] Unit tests for risk engine

---

*GhostScan — Know what they know. Take it back.*
