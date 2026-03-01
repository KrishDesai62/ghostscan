-- GhostScan Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       text UNIQUE NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── verification_sessions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.verification_sessions (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  otp_verified_at    timestamptz NOT NULL,
  liveness_status    text NOT NULL DEFAULT 'skipped' CHECK (liveness_status IN ('passed','failed','skipped')),
  liveness_challenge text,
  liveness_metrics   jsonb,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ── scans ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scans (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  verification_session_id uuid NOT NULL REFERENCES public.verification_sessions(id),
  report_type             text NOT NULL CHECK (report_type IN ('verified_full','limited_fallback')),
  risk_score              int NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_level              text NOT NULL CHECK (risk_level IN ('low','moderate','high')),
  confidence              text NOT NULL CHECK (confidence IN ('low','medium','high')),
  takeover_risk           int,
  theft_risk              int,
  phishing_risk           int,
  exposure_risk           int,
  signal_snapshot         jsonb,
  mitigation_baseline     jsonb,
  exposure_velocity       numeric,
  trend                   text CHECK (trend IN ('increasing','stable','declining')),
  created_at              timestamptz NOT NULL DEFAULT now(),
  expires_at              timestamptz NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- ── breaches ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.breaches (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id       uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  breach_name   text,
  breach_domain text,
  breach_date   date,
  pwn_count     bigint,
  data_classes  text[],
  is_verified   boolean DEFAULT false,
  is_sensitive  boolean DEFAULT false
);

-- ── consent_events ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consent_events (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scan_id    uuid REFERENCES public.scans(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('privacy','terms','camera','processing')),
  version    text NOT NULL DEFAULT '1.0',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── legal_exports ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.legal_exports (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id          uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  regime           text NOT NULL CHECK (regime IN ('gdpr','ccpa','us_state_delete','breach_erasure')),
  template_version text NOT NULL DEFAULT '1.0',
  target_name      text,
  target_email     text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── deletion_requests (NEW — Rocket Money style tracker) ─────
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scan_id        uuid REFERENCES public.scans(id) ON DELETE SET NULL,
  target_id      text NOT NULL,         -- broker/breach identifier
  target_name    text NOT NULL,
  target_email   text,
  target_url     text,
  target_type    text CHECK (target_type IN ('broker','breach','other')),
  regime         text CHECK (regime IN ('gdpr','ccpa','us_state_delete','breach_erasure')),
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','queued','sent','awaiting_response','deleted','failed','escalated')),
  sent_at        timestamptz,
  responded_at   timestamptz,
  confirmed_at   timestamptz,
  escalate_after timestamptz,           -- auto-escalate 30 days after sent_at
  notes          text,
  ref_id         text,                  -- email reference ID for tracking
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_expires_at ON public.scans(expires_at);
CREATE INDEX IF NOT EXISTS idx_breaches_scan_id ON public.breaches(scan_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON public.deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_escalate ON public.deletion_requests(escalate_after) WHERE status = 'sent';

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "users_own_data" ON public.users
  FOR ALL USING (id = auth.uid());

CREATE POLICY "verification_sessions_own" ON public.verification_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "scans_own" ON public.scans
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "breaches_via_scan" ON public.breaches
  FOR ALL USING (
    scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
  );

CREATE POLICY "consent_events_own" ON public.consent_events
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "legal_exports_via_scan" ON public.legal_exports
  FOR ALL USING (
    scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid())
  );

CREATE POLICY "deletion_requests_own" ON public.deletion_requests
  FOR ALL USING (user_id = auth.uid());

-- ── Auto-update updated_at trigger ──────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deletion_requests_updated_at
  BEFORE UPDATE ON public.deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Purge function (called by cron) ─────────────────────────
CREATE OR REPLACE FUNCTION public.purge_expired_scans()
RETURNS TABLE(purged_scans int, purged_breaches int) AS $$
DECLARE
  _purged_scans int;
  _purged_breaches int;
BEGIN
  -- Breaches cascade delete from scans
  SELECT COUNT(*) INTO _purged_breaches
  FROM public.breaches b
  JOIN public.scans s ON b.scan_id = s.id
  WHERE s.expires_at < now();

  DELETE FROM public.scans WHERE expires_at < now();
  GET DIAGNOSTICS _purged_scans = ROW_COUNT;

  RETURN QUERY SELECT _purged_scans, _purged_breaches;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Backward-compatible constraint updates ──────────────────
-- If your tables already exist from an older schema, run these too.
ALTER TABLE public.legal_exports
  DROP CONSTRAINT IF EXISTS legal_exports_regime_check;
ALTER TABLE public.legal_exports
  ADD CONSTRAINT legal_exports_regime_check
  CHECK (regime IN ('gdpr','ccpa','us_state_delete','breach_erasure'));

ALTER TABLE public.deletion_requests
  DROP CONSTRAINT IF EXISTS deletion_requests_regime_check;
ALTER TABLE public.deletion_requests
  ADD CONSTRAINT deletion_requests_regime_check
  CHECK (regime IN ('gdpr','ccpa','us_state_delete','breach_erasure'));
