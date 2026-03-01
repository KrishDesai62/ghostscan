export type ResidencyState = 'CA' | 'CO' | 'CT' | 'UT' | 'VA' | 'TX' | 'OR' | 'DE' | 'NJ' | 'IA' | 'IN' | 'TN' | 'MT' | 'US_OTHER' | 'NON_US';

export interface PrivacyLawProfile {
  state: ResidencyState;
  label: string;
  lawName: string;
  recommendedRegime: 'ccpa' | 'gdpr' | 'us_state_delete';
  note: string;
}

export const PRIVACY_LAW_PROFILES: PrivacyLawProfile[] = [
  {
    state: 'CA',
    label: 'California',
    lawName: 'CCPA/CPRA',
    recommendedRegime: 'ccpa',
    note: 'California has the strongest explicit delete rights in this app via CCPA templates.',
  },
  {
    state: 'CO',
    label: 'Colorado',
    lawName: 'Colorado Privacy Act',
    recommendedRegime: 'us_state_delete',
    note: 'Colorado deletion rights exist; this app uses the closest U.S. deletion template format.',
  },
  {
    state: 'CT',
    label: 'Connecticut',
    lawName: 'CTDPA',
    recommendedRegime: 'us_state_delete',
    note: 'Connecticut grants deletion rights; use U.S.-style deletion requests in this flow.',
  },
  {
    state: 'UT',
    label: 'Utah',
    lawName: 'UCPA',
    recommendedRegime: 'us_state_delete',
    note: 'Utah has deletion rights with carve-outs; use this as a practical deletion starting point.',
  },
  {
    state: 'VA',
    label: 'Virginia',
    lawName: 'VCDPA',
    recommendedRegime: 'us_state_delete',
    note: 'Virginia provides deletion rights; this maps to U.S. deletion language.',
  },
  {
    state: 'TX',
    label: 'Texas',
    lawName: 'TDPSA',
    recommendedRegime: 'us_state_delete',
    note: 'Texas has modern privacy rights; templates remain U.S.-style until state-specific text is added.',
  },
  {
    state: 'OR',
    label: 'Oregon',
    lawName: 'Oregon Consumer Privacy Act',
    recommendedRegime: 'us_state_delete',
    note: 'Oregon includes deletion rights; use U.S.-style requests and portal opt-outs.',
  },
  {
    state: 'DE',
    label: 'Delaware',
    lawName: 'Delaware Personal Data Privacy Act',
    recommendedRegime: 'us_state_delete',
    note: 'Delaware has deletion rights; this maps to U.S.-style deletion request wording.',
  },
  {
    state: 'NJ',
    label: 'New Jersey',
    lawName: 'New Jersey Data Privacy Act',
    recommendedRegime: 'us_state_delete',
    note: 'New Jersey deletion rights are supported via the U.S.-style template path.',
  },
  {
    state: 'IA',
    label: 'Iowa',
    lawName: 'Iowa Consumer Data Protection Act',
    recommendedRegime: 'us_state_delete',
    note: 'Iowa has narrower rights; use U.S.-style requests plus direct portal removals.',
  },
  {
    state: 'IN',
    label: 'Indiana',
    lawName: 'Indiana Consumer Data Protection Act',
    recommendedRegime: 'us_state_delete',
    note: 'Indiana deletion rights exist; use U.S.-style deletion request language.',
  },
  {
    state: 'TN',
    label: 'Tennessee',
    lawName: 'TIPA',
    recommendedRegime: 'us_state_delete',
    note: 'Tennessee rights exist with safe-harbor mechanics; start with U.S.-style requests.',
  },
  {
    state: 'MT',
    label: 'Montana',
    lawName: 'Montana Consumer Data Privacy Act',
    recommendedRegime: 'us_state_delete',
    note: 'Montana supports deletion rights; U.S.-style requests are the closest fit here.',
  },
  {
    state: 'US_OTHER',
    label: 'Another U.S. state',
    lawName: 'State privacy law varies',
    recommendedRegime: 'us_state_delete',
    note: 'Use U.S.-style deletion requests and broker opt-out portals while state-specific text is added.',
  },
  {
    state: 'NON_US',
    label: 'Outside the U.S.',
    lawName: 'GDPR/other local law',
    recommendedRegime: 'gdpr',
    note: 'For EU/EEA/UK users, GDPR Article 17 is generally the best fit in this app.',
  },
];

export function getPrivacyLawProfile(state: ResidencyState): PrivacyLawProfile {
  return PRIVACY_LAW_PROFILES.find((profile) => profile.state === state) ?? PRIVACY_LAW_PROFILES[PRIVACY_LAW_PROFILES.length - 2];
}
