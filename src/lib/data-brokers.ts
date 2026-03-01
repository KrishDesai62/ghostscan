// src/lib/data-brokers.ts
// API-free local broker registry + email/state-aware target selection.

export interface DataBroker {
  id: string;
  name: string;
  category:
    | 'People Search'
    | 'Background Check'
    | 'Data Aggregator'
    | 'Marketing Data'
    | 'Credit/Marketing'
    | 'Property Data'
    | 'Reputation'
    | 'Public Records';
  privacyEmail: string;
  privacyUrl: string;
  supportedRegimes: ('gdpr' | 'ccpa')[];
  hasOnlinePortal: boolean;
  autoOptOut: boolean;
  confidence: 'high' | 'medium';
  source: 'local_catalog';
  notes?: string;
}

export const DATA_BROKERS: DataBroker[] = [
  // People Search
  { id: 'spokeo', name: 'Spokeo', category: 'People Search', privacyEmail: 'privacy@spokeo.com', privacyUrl: 'https://www.spokeo.com/optout', supportedRegimes: ['ccpa', 'gdpr'], hasOnlinePortal: true, autoOptOut: true, confidence: 'high', source: 'local_catalog' },
  { id: 'whitepages', name: 'Whitepages', category: 'People Search', privacyEmail: 'support@whitepages.com', privacyUrl: 'https://www.whitepages.com/suppression_requests', supportedRegimes: ['ccpa'], hasOnlinePortal: true, autoOptOut: true, confidence: 'high', source: 'local_catalog' },
  { id: 'intelius', name: 'Intelius', category: 'People Search', privacyEmail: 'privacy@intelius.com', privacyUrl: 'https://www.intelius.com/opt-out', supportedRegimes: ['ccpa'], hasOnlinePortal: true, autoOptOut: true, confidence: 'high', source: 'local_catalog' },
  { id: 'peoplefinders', name: 'PeopleFinders', category: 'People Search', privacyEmail: 'privacy@peoplefinders.com', privacyUrl: 'https://www.peoplefinders.com/opt-out', supportedRegimes: ['ccpa'], hasOnlinePortal: true, autoOptOut: true, confidence: 'high', source: 'local_catalog' },
  { id: 'truepeoplesearch', name: 'TruePeopleSearch', category: 'People Search', privacyEmail: 'privacy@truepeoplesearch.com', privacyUrl: 'https://www.truepeoplesearch.com/removal', supportedRegimes: ['ccpa'], hasOnlinePortal: true, autoOptOut: true, confidence: 'high', source: 'local_catalog' },
  { id: 'fastpeoplesearch', name: 'FastPeopleSearch', category: 'People Search', privacyEmail: 'optout@fastpeoplesearch.com', privacyUrl: 'https://www.fastpeoplesearch.com/removal', supportedRegimes: ['ccpa'], hasOnlinePortal: true, autoOptOut: true, confidence: 'high', source: 'local_catalog' },
  { id: 'usphonebook', name: 'US Phone Book', category: 'People Search', privacyEmail: 'privacy@usphonebook.com', privacyUrl: 'https://www.usphonebook.com/opt-out', supportedRegimes: ['ccpa'], hasOnlinePortal: true, autoOptOut: false, confidence: 'medium', source: 'local_catalog' },

  // Background / Public Records
  { id: 'beenverified', name: 'BeenVerified', category: 'Background Check', privacyEmail: 'optout@beenverified.com', privacyUrl: 'https://www.beenverified.com/app/optout/search', supportedRegimes: ['ccpa'], hasOnlinePortal: true, autoOptOut: false, confidence: 'high', source: 'local_catalog' },
  { id: 'instantcheckmate', name: 'Instant Checkmate', category: 'Background Check', privacyEmail: 'privacy@instantcheckmate.com', privacyUrl: 'https://www.instantcheckmate.com/opt-out/', supportedRegimes: ['ccpa'], hasOnlinePortal: true, autoOptOut: false, confidence: 'high', source: 'local_catalog' },
  { id: 'checkpeople', name: 'CheckPeople', category: 'Background Check', privacyEmail: 'privacy@checkpeople.com', privacyUrl: 'https://www.checkpeople.com/opt-out', supportedRegimes: ['ccpa'], hasOnlinePortal: true, autoOptOut: false, confidence: 'medium', source: 'local_catalog' },
  { id: 'truthfinder', name: 'TruthFinder', category: 'Background Check', privacyEmail: 'privacy@truthfinder.com', privacyUrl: 'https://www.truthfinder.com/opt-out/', supportedRegimes: ['ccpa'], hasOnlinePortal: true, autoOptOut: false, confidence: 'high', source: 'local_catalog' },

  // Aggregators / Marketing
  { id: 'acxiom', name: 'Acxiom', category: 'Data Aggregator', privacyEmail: 'optout@acxiom.com', privacyUrl: 'https://www.acxiom.com/optout/', supportedRegimes: ['ccpa', 'gdpr'], hasOnlinePortal: true, autoOptOut: false, confidence: 'high', source: 'local_catalog' },
  { id: 'epsilon', name: 'Epsilon', category: 'Data Aggregator', privacyEmail: 'privacy@epsilon.com', privacyUrl: 'https://www.epsilon.com/us/privacy-policy', supportedRegimes: ['ccpa', 'gdpr'], hasOnlinePortal: false, autoOptOut: false, confidence: 'high', source: 'local_catalog' },
  { id: 'lexisnexis', name: 'LexisNexis', category: 'Data Aggregator', privacyEmail: 'privacy@lexisnexis.com', privacyUrl: 'https://optout.lexisnexis.com/', supportedRegimes: ['ccpa', 'gdpr'], hasOnlinePortal: true, autoOptOut: false, confidence: 'high', source: 'local_catalog' },
  { id: 'transunion-mkt', name: 'TransUnion Marketing', category: 'Data Aggregator', privacyEmail: 'privacy@transunion.com', privacyUrl: 'https://www.transunion.com/consumer-privacy', supportedRegimes: ['ccpa', 'gdpr'], hasOnlinePortal: true, autoOptOut: false, confidence: 'high', source: 'local_catalog' },
  { id: 'oracle-data-cloud', name: 'Oracle Data Cloud', category: 'Marketing Data', privacyEmail: 'dataprivacy_ww@oracle.com', privacyUrl: 'https://www.oracle.com/legal/privacy/', supportedRegimes: ['ccpa', 'gdpr'], hasOnlinePortal: true, autoOptOut: false, confidence: 'high', source: 'local_catalog' },
  { id: 'neustar', name: 'Neustar', category: 'Marketing Data', privacyEmail: 'privacy@neustar.biz', privacyUrl: 'https://www.neustar.biz/privacy-policy', supportedRegimes: ['ccpa', 'gdpr'], hasOnlinePortal: false, autoOptOut: false, confidence: 'medium', source: 'local_catalog' },

  // Other major profiles
  { id: 'corelogic', name: 'CoreLogic', category: 'Property Data', privacyEmail: 'privacy@corelogic.com', privacyUrl: 'https://www.corelogic.com/privacy-center', supportedRegimes: ['ccpa'], hasOnlinePortal: true, autoOptOut: false, confidence: 'high', source: 'local_catalog' },
  { id: 'experian-mkt', name: 'Experian Marketing', category: 'Credit/Marketing', privacyEmail: 'privacy@experian.com', privacyUrl: 'https://www.experian.com/privacy/opting_out_prescreen_offers.html', supportedRegimes: ['ccpa', 'gdpr'], hasOnlinePortal: true, autoOptOut: false, confidence: 'high', source: 'local_catalog' },
  { id: 'mylife', name: 'MyLife', category: 'Reputation', privacyEmail: 'privacy@mylife.com', privacyUrl: 'https://www.mylife.com/privacy-policy', supportedRegimes: ['ccpa', 'gdpr'], hasOnlinePortal: false, autoOptOut: false, confidence: 'medium', source: 'local_catalog' },
  { id: 'radaris', name: 'Radaris', category: 'Data Aggregator', privacyEmail: 'privacy@radaris.com', privacyUrl: 'https://radaris.com/page/how-to-remove', supportedRegimes: ['ccpa', 'gdpr'], hasOnlinePortal: true, autoOptOut: false, confidence: 'medium', source: 'local_catalog' },
];

const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
]);

function isUsResidency(userState?: string): boolean {
  if (!userState) return true;
  return userState.startsWith('US_');
}

function scoreBroker(broker: DataBroker, isUs: boolean, breachCount: number, isPublicMailbox: boolean): number {
  let score = 0;
  if (broker.confidence === 'high') score += 5;
  if (broker.hasOnlinePortal) score += 3;
  if (broker.autoOptOut) score += 2;
  if (isUs && broker.supportedRegimes.includes('ccpa')) score += 2;
  if (!isUs && broker.supportedRegimes.includes('gdpr')) score += 2;

  if (breachCount >= 2 && (broker.category === 'Data Aggregator' || broker.category === 'Marketing Data')) {
    score += 2;
  }
  if (isPublicMailbox && broker.category === 'People Search') {
    score += 1;
  }

  return score;
}

export function getRecommendedBrokersForUser(input: {
  email: string;
  userState?: string;
  breachCount?: number;
}): DataBroker[] {
  const emailDomain = (input.email.split('@')[1] || '').toLowerCase();
  const isPublicMailbox = PUBLIC_EMAIL_DOMAINS.has(emailDomain);
  const breachCount = Math.max(0, input.breachCount ?? 0);
  const isUs = isUsResidency(input.userState);

  const eligible = DATA_BROKERS.filter((broker) =>
    isUs ? true : broker.supportedRegimes.includes('gdpr')
  );

  const sorted = [...eligible].sort((a, b) => {
    const delta = scoreBroker(b, isUs, breachCount, isPublicMailbox) - scoreBroker(a, isUs, breachCount, isPublicMailbox);
    if (delta !== 0) return delta;
    return a.name.localeCompare(b.name);
  });

  const cap = breachCount >= 3 ? 20 : breachCount >= 1 ? 16 : 12;
  return sorted.slice(0, cap);
}

export function getBrokerById(id: string): DataBroker | undefined {
  return DATA_BROKERS.find((b) => b.id === id);
}

export function getBrokersByRegime(regime: 'gdpr' | 'ccpa'): DataBroker[] {
  return DATA_BROKERS.filter((b) => b.supportedRegimes.includes(regime));
}
