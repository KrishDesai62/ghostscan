// src/lib/hibp.ts
// Have I Been Pwned adapter
// Falls back to mock data if HIBP_API_KEY is not set or request fails

import crypto from 'crypto';

export interface HibpBreach {
  Name: string;
  Domain: string;
  BreachDate: string;
  PwnCount: number;
  DataClasses: string[];
  IsVerified: boolean;
  IsSensitive: boolean;
}

export type BreachDataSource = 'live_hibp' | 'mock_demo' | 'mock_no_api_key' | 'mock_fallback';

const MOCK_BREACHES: HibpBreach[] = [
  { Name: "LinkedIn",  Domain: "linkedin.com",  BreachDate: "2021-06-22", PwnCount: 700000000, DataClasses: ["Email addresses","Names","Phone numbers","Professional experience"], IsVerified: true,  IsSensitive: false },
  { Name: "Adobe",     Domain: "adobe.com",     BreachDate: "2013-10-04", PwnCount: 153000000, DataClasses: ["Email addresses","Password hints","Passwords","Usernames"],          IsVerified: true,  IsSensitive: false },
  { Name: "Canva",     Domain: "canva.com",     BreachDate: "2019-05-24", PwnCount: 137272116, DataClasses: ["Email addresses","Geographic locations","Names","Passwords"],         IsVerified: true,  IsSensitive: false },
  { Name: "Dropbox",   Domain: "dropbox.com",   BreachDate: "2012-07-01", PwnCount: 68648009,  DataClasses: ["Email addresses","Passwords"],                                       IsVerified: true,  IsSensitive: false },
  { Name: "Twitter",   Domain: "twitter.com",   BreachDate: "2022-11-27", PwnCount: 211524284, DataClasses: ["Email addresses","Phone numbers"],                                   IsVerified: true,  IsSensitive: false },
];

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

export async function checkBreaches(email: string): Promise<{ breaches: HibpBreach[]; degraded: boolean; source: BreachDataSource }> {
  const apiKey = process.env.HIBP_API_KEY;
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (isDemoMode) {
    // Return mock data with a realistic-looking delay
    await new Promise(r => setTimeout(r, 800));
    console.log(`[HIBP] Demo mode enabled — using mock data (hash: ${hashEmail(email).slice(0, 8)}...)`);
    return { breaches: MOCK_BREACHES, degraded: true, source: 'mock_demo' };
  }

  if (!apiKey) {
    await new Promise(r => setTimeout(r, 800));
    console.log(`[HIBP] No API key — using mock data (hash: ${hashEmail(email).slice(0, 8)}...)`);
    return { breaches: MOCK_BREACHES, degraded: true, source: 'mock_no_api_key' };
  }

  try {
    const res = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      {
        headers: {
          'hibp-api-key': apiKey,
          'User-Agent': 'GhostScan-HackathonMVP/1.0',
        },
        next: { revalidate: 0 },
      }
    );

    if (res.status === 404) return { breaches: [], degraded: false, source: 'live_hibp' };
    if (res.status === 429) {
      console.warn('[HIBP] Rate limited — falling back to mock');
      return { breaches: MOCK_BREACHES, degraded: true, source: 'mock_fallback' };
    }
    if (!res.ok) {
      console.error(`[HIBP] Error ${res.status} — falling back to mock`);
      return { breaches: MOCK_BREACHES, degraded: true, source: 'mock_fallback' };
    }

    const data = await res.json();
    return { breaches: data as HibpBreach[], degraded: false, source: 'live_hibp' };
  } catch (err) {
    console.error('[HIBP] Network error — falling back to mock:', err);
    return { breaches: MOCK_BREACHES, degraded: true, source: 'mock_fallback' };
  }
}

export async function checkGravatar(email: string): Promise<boolean> {
  try {
    const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
    const res = await fetch(`https://www.gravatar.com/${hash}.json`, { method: 'HEAD', next: { revalidate: 3600 } });
    return res.ok;
  } catch {
    return false;
  }
}

export function isDisposableDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  const DISPOSABLE = new Set([
    'mailinator.com','guerrillamail.com','temp-mail.org','throwaway.email',
    'yopmail.com','10minutemail.com','sharklasers.com','guerrillamailblock.com',
    'grr.la','guerrillamail.info','guerrillamail.biz','guerrillamail.de',
    'guerrillamail.net','guerrillamail.org','spam4.me','trashmail.com',
    'dispostable.com','mailnull.com','spam.la','trashmail.at','trashmail.io',
    'fakeinbox.com','spamgourmet.com','spamgourmet.net','spamgourmet.org',
    'getairmail.com','filzmail.com','wegwerfmail.de','spambog.com',
  ]);
  return DISPOSABLE.has(domain ?? '');
}

export function isPredictablePattern(email: string): boolean {
  const [local] = email.split('@');
  return /^(info|admin|contact|hello|test|noreply|no-reply|support|help|mail|email|postmaster)$/i.test(local);
}

// Extract signals from breach data
export function extractSignals(breaches: HibpBreach[]) {
  const allDataClasses = breaches.flatMap(b => b.DataClasses.map(d => d.toLowerCase()));
  return {
    hasPassword:     allDataClasses.some(d => d.includes('password') && !d.includes('hint')),
    hasPasswordHash: allDataClasses.some(d => d.includes('password hash')),
    hasName:         allDataClasses.some(d => d.includes('name')),
    hasPhone:        allDataClasses.some(d => d.includes('phone')),
    hasAddress:      allDataClasses.some(d => d.includes('address') || d.includes('location')),
    hasDOB:          allDataClasses.some(d => d.includes('date of birth') || d.includes('dob')),
  };
}
