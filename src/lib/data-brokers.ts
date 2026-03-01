// src/lib/data-brokers.ts
// Registry of data brokers and how to contact them for deletion

export interface DataBroker {
  id: string;
  name: string;
  category: 'People Search' | 'Background Check' | 'Data Aggregator' | 'Marketing Data' | 'Credit/Marketing' | 'Property Data' | 'Reputation' | 'Public Records';
  privacyEmail: string;
  privacyUrl: string;
  supportedRegimes: ('gdpr' | 'ccpa')[];
  hasOnlinePortal: boolean;   // can opt out via web form
  autoOptOut: boolean;        // portal is direct/automated
  notes?: string;
}

export const DATA_BROKERS: DataBroker[] = [
  // ── People Search ───────────────────────────────────────────
  { id: "spokeo",         name: "Spokeo",            category: "People Search",    privacyEmail: "privacy@spokeo.com",          privacyUrl: "https://www.spokeo.com/optout",                        supportedRegimes: ["ccpa","gdpr"], hasOnlinePortal: true,  autoOptOut: true  },
  { id: "whitepages",     name: "Whitepages",         category: "People Search",    privacyEmail: "support@whitepages.com",       privacyUrl: "https://www.whitepages.com/suppression_requests",     supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: true  },
  { id: "intelius",       name: "Intelius",           category: "People Search",    privacyEmail: "privacy@intelius.com",         privacyUrl: "https://www.intelius.com/opt-out",                    supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: true  },
  { id: "peoplefinders",  name: "PeopleFinder",       category: "People Search",    privacyEmail: "privacy@peoplefinders.com",    privacyUrl: "https://www.peoplefinders.com/opt-out",               supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: true  },
  { id: "truepeoplesearch",name: "TruePeopleSearch",  category: "People Search",    privacyEmail: "privacy@truepeoplesearch.com", privacyUrl: "https://www.truepeoplesearch.com/removal",            supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: true  },
  { id: "fastpeoplesearch",name: "FastPeopleSearch",  category: "People Search",    privacyEmail: "optout@fastpeoplesearch.com",  privacyUrl: "https://www.fastpeoplesearch.com/removal",            supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: true  },
  { id: "411",            name: "411.com",             category: "People Search",    privacyEmail: "privacy@411.com",              privacyUrl: "https://www.411.com/privacy",                         supportedRegimes: ["ccpa"],        hasOnlinePortal: false, autoOptOut: false },
  { id: "usphonebook",    name: "US Phone Book",       category: "People Search",    privacyEmail: "privacy@usphonebook.com",      privacyUrl: "https://www.usphonebook.com/opt-out",                 supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: false },
  { id: "addresses",      name: "Addresses.com",       category: "People Search",    privacyEmail: "privacy@addresses.com",        privacyUrl: "https://www.addresses.com/optout.php",                supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: false },
  { id: "anywho",         name: "AnyWho",              category: "People Search",    privacyEmail: "privacy@anywho.com",           privacyUrl: "https://www.anywho.com/privacy",                      supportedRegimes: ["ccpa"],        hasOnlinePortal: false, autoOptOut: false },
  // ── Background Check ────────────────────────────────────────
  { id: "beenverified",   name: "BeenVerified",        category: "Background Check", privacyEmail: "optout@beenverified.com",      privacyUrl: "https://www.beenverified.com/app/optout/search",      supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: false },
  { id: "instantcheckmate",name: "Instant Checkmate",  category: "Background Check", privacyEmail: "privacy@instantcheckmate.com", privacyUrl: "https://www.instantcheckmate.com/opt-out/",           supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: false },
  { id: "checkpeople",    name: "CheckPeople",          category: "Background Check", privacyEmail: "privacy@checkpeople.com",      privacyUrl: "https://www.checkpeople.com/opt-out",                 supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: false },
  { id: "truthfinder",    name: "TruthFinder",          category: "Background Check", privacyEmail: "privacy@truthfinder.com",      privacyUrl: "https://www.truthfinder.com/opt-out/",                supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: false },
  { id: "arrest-org",     name: "Arrest.org",           category: "Public Records",   privacyEmail: "privacy@arrest.org",           privacyUrl: "https://arrest.org/opt-out/",                         supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: false },
  // ── Data Aggregators ─────────────────────────────────────────
  { id: "acxiom",         name: "Acxiom",              category: "Data Aggregator",  privacyEmail: "optout@acxiom.com",            privacyUrl: "https://www.acxiom.com/optout/",                      supportedRegimes: ["ccpa","gdpr"], hasOnlinePortal: true,  autoOptOut: false },
  { id: "epsilon",        name: "Epsilon",              category: "Data Aggregator",  privacyEmail: "privacy@epsilon.com",          privacyUrl: "https://www.epsilon.com/us/privacy-policy",           supportedRegimes: ["ccpa","gdpr"], hasOnlinePortal: false, autoOptOut: false },
  { id: "corelogic",      name: "CoreLogic",            category: "Property Data",    privacyEmail: "privacy@corelogic.com",        privacyUrl: "https://www.corelogic.com/privacy-center",            supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: false },
  { id: "experian-mkt",   name: "Experian Marketing",  category: "Credit/Marketing", privacyEmail: "privacy@experian.com",         privacyUrl: "https://www.experian.com/privacy/opting_out_prescreen_offers.html", supportedRegimes: ["ccpa","gdpr"], hasOnlinePortal: true, autoOptOut: false },
  { id: "lexisnexis",     name: "LexisNexis",           category: "Data Aggregator",  privacyEmail: "privacy@lexisnexis.com",       privacyUrl: "https://optout.lexisnexis.com/",                      supportedRegimes: ["ccpa","gdpr"], hasOnlinePortal: true,  autoOptOut: false },
  { id: "databrokerplus",  name: "DataBroker+",         category: "Data Aggregator",  privacyEmail: "privacy@databrokerplus.com",   privacyUrl: "https://www.databrokerplus.com",                      supportedRegimes: ["ccpa"],        hasOnlinePortal: false, autoOptOut: false },
  { id: "transunion-mkt",  name: "TransUnion Marketing",category: "Data Aggregator",  privacyEmail: "privacy@transunion.com",       privacyUrl: "https://www.transunion.com/consumer-privacy",         supportedRegimes: ["ccpa","gdpr"], hasOnlinePortal: true,  autoOptOut: false },
  // ── Reputation ───────────────────────────────────────────────
  { id: "mylife",         name: "MyLife",               category: "Reputation",       privacyEmail: "privacy@mylife.com",           privacyUrl: "https://www.mylife.com/privacy-policy",               supportedRegimes: ["ccpa","gdpr"], hasOnlinePortal: false, autoOptOut: false },
  { id: "radaris",        name: "Radaris",               category: "Data Aggregator",  privacyEmail: "privacy@radaris.com",          privacyUrl: "https://radaris.com/page/how-to-remove",              supportedRegimes: ["ccpa","gdpr"], hasOnlinePortal: true,  autoOptOut: false },
  // ── Marketing ────────────────────────────────────────────────
  { id: "datalogix",      name: "Oracle Data Cloud",    category: "Marketing Data",   privacyEmail: "dataprivacy_ww@oracle.com",    privacyUrl: "https://www.oracle.com/legal/privacy/",               supportedRegimes: ["ccpa","gdpr"], hasOnlinePortal: true,  autoOptOut: false },
  { id: "neustar",        name: "Neustar",               category: "Marketing Data",   privacyEmail: "privacy@neustar.biz",          privacyUrl: "https://www.neustar.biz/privacy-policy",              supportedRegimes: ["ccpa","gdpr"], hasOnlinePortal: false, autoOptOut: false },
  { id: "ims",            name: "Infogroup / Data.com",  category: "Marketing Data",   privacyEmail: "privacy@data.com",             privacyUrl: "https://www.data.com/privacy",                        supportedRegimes: ["ccpa"],        hasOnlinePortal: false, autoOptOut: false },
  { id: "harte-hanks",    name: "Harte-Hanks",           category: "Marketing Data",   privacyEmail: "privacy@hartehanks.com",       privacyUrl: "https://www.hartehanks.com/privacy",                  supportedRegimes: ["ccpa","gdpr"], hasOnlinePortal: false, autoOptOut: false },
  // ── Public Records ────────────────────────────────────────────
  { id: "publicrecordsnow",name: "PublicRecordsNow",     category: "Public Records",   privacyEmail: "privacy@publicrecordsnow.com", privacyUrl: "https://www.publicrecordsnow.com/opt-out",             supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: false },
  { id: "voterrecords",    name: "Voter Records",         category: "Public Records",   privacyEmail: "privacy@voterrecords.com",     privacyUrl: "https://voterrecords.com/opt-out",                    supportedRegimes: ["ccpa"],        hasOnlinePortal: true,  autoOptOut: false },
];

export function getBrokerById(id: string): DataBroker | undefined {
  return DATA_BROKERS.find(b => b.id === id);
}

export function getBrokersByRegime(regime: 'gdpr' | 'ccpa'): DataBroker[] {
  return DATA_BROKERS.filter(b => b.supportedRegimes.includes(regime));
}
