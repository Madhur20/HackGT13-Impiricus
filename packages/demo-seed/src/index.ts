import type { AllowedField, DrugClassId, DrugClassRef, ExpertiseEdge, ExpertiseSource, ExpertiseTag, HcpProfile, HelpMode, PeerHelpProfile, Persona, PracticeUpdate, PrescribingProfile, PrescribingStat, TrustEdge } from "@relay/domain";

export const personas: Persona[] = [
  { id: "hcp-maya", name: "Dr. Maya Chen", role: "hcp", subtitle: "Endocrinology · Atlanta, GA", initials: "MC", specialty: "Endocrinology", location: "Atlanta, GA", credentialStatus: "verified", npi: "1234567890" },
  { id: "hcp-jordan", name: "Dr. Jordan Brooks", role: "hcp", subtitle: "Internal Medicine · Decatur, GA", initials: "JB", specialty: "Internal Medicine", location: "Decatur, GA", credentialStatus: "verified", npi: "1357924680" },
  { id: "hcp-1", name: "Dr. Elena Ruiz", role: "hcp", subtitle: "Endocrinology · Savannah, GA", initials: "ER", specialty: "Endocrinology", location: "Savannah, GA", credentialStatus: "verified", npi: "1098765432" },
];

const specialties = ["Endocrinology", "Internal Medicine", "Family Medicine"];
const states = ["GA", "GA", "GA", "NC", "FL"];
const areas = ["GLP-1 therapies", "SGLT2 inhibitors", "Diabetes management"];

const accountProfiles: HcpProfile[] = [
  {
    id: "hcp-maya",
    displayName: "Dr. Maya Chen",
    specialty: "Endocrinology",
    state: "GA",
    therapeuticAreas: ["GLP-1 therapies", "SGLT2 inhibitors", "Diabetes management"],
    topics: ["Initiation", "Monitoring", "Switching", "Tolerability"],
    conditionTags: ["Renal impairment", "Cardiovascular disease", "Diabetes"],
    availability: "available",
    verified: true,
    matchingConsent: true,
    contactConsent: true,
    responseReliability: 0.98,
    timezoneFit: 1,
    provenance: [
      { label: "Public registry", source: "NPPES" },
      { label: "Physician provided", source: "HCP_DECLARED" },
      { label: "Permitted for matching", source: "IMPIRICUS_INTERACTION" },
    ],
  },
  {
    id: "hcp-jordan",
    displayName: "Dr. Jordan Brooks",
    specialty: "Internal Medicine",
    state: "GA",
    therapeuticAreas: ["GLP-1 therapies", "SGLT2 inhibitors", "Diabetes management"],
    topics: ["Monitoring", "Switching", "Tolerability"],
    conditionTags: ["Cardiovascular disease", "Diabetes"],
    availability: "available",
    verified: true,
    matchingConsent: true,
    contactConsent: true,
    responseReliability: 0.94,
    timezoneFit: 1,
    provenance: [
      { label: "Public registry", source: "NPPES" },
      { label: "Physician provided", source: "HCP_DECLARED" },
      { label: "Permitted for matching", source: "IMPIRICUS_INTERACTION" },
    ],
  },
];

const baseHcpProfiles: HcpProfile[] = Array.from({ length: 36 }, (_, index) => ({
  id: `hcp-${index + 1}`,
  displayName: ["Dr. Elena Ruiz", "Dr. Marcus Lee", "Dr. Priya Shah", "Dr. Noah Williams"][index % 4] + (index > 3 ? ` ${index + 1}` : ""),
  specialty: specialties[index % specialties.length],
  state: states[index % states.length],
  therapeuticAreas: index % 5 === 0 ? [areas[1], areas[2]] : [areas[0], areas[1]],
  topics: index % 3 === 0 ? ["Monitoring", "Switching"] : ["Initiation", "Monitoring", "Tolerability"],
  conditionTags: index % 2 === 0 ? ["Renal impairment", "Diabetes"] : ["Cardiovascular disease", "Diabetes"],
  availability: index === 4 ? "unavailable" : index % 5 === 0 ? "limited" : "available",
  verified: index !== 3,
  matchingConsent: index !== 2,
  contactConsent: index % 2 === 0,
  responseReliability: Math.max(0.58, 0.96 - index * 0.011),
  timezoneFit: index % 4 === 0 ? 1 : 0.8,
  provenance: [
    { label: "Public registry", source: "NPPES" },
    { label: "Physician provided", source: "HCP_DECLARED" },
    { label: "Permitted for matching", source: "IMPIRICUS_INTERACTION" },
  ],
}));

// --- Featured cross-specialty experts -------------------------------------
// High-signal physicians (Internal Medicine and Family Medicine, not just
// Endocrinology) with strong, corroborated expertise and a track record of
// useful peer help. They guarantee at least two ~90%+ matches for every
// medication category, so the demo visibly shows the contextual bandit
// exploiting validated peers. Their non-Endocrinology specialties reinforce
// Relay's thesis: match on real prescribing/condition expertise, not titles.
const FEATURED_STRENGTH = 0.93;
const FEATURED_CONDITION_TAG_IDS = ["renal_impairment", "cardiovascular_disease", "diabetes", "hepatic_impairment"];

const featuredConfig: { id: string; name: string; specialty: string; state: string; drugClass: DrugClassId }[] = [
  { id: "hcp-37", name: "Dr. Sarah Okafor", specialty: "Internal Medicine", state: "GA", drugClass: "sglt2" },
  { id: "hcp-38", name: "Dr. David Kim", specialty: "Internal Medicine", state: "GA", drugClass: "sglt2" },
  { id: "hcp-39", name: "Dr. Aisha Rahman", specialty: "Family Medicine", state: "NC", drugClass: "sglt2" },
  { id: "hcp-40", name: "Dr. Miguel Santos", specialty: "Internal Medicine", state: "GA", drugClass: "glp1" },
  { id: "hcp-41", name: "Dr. Hannah Cohen", specialty: "Family Medicine", state: "GA", drugClass: "glp1" },
  { id: "hcp-42", name: "Dr. Robert Nguyen", specialty: "Internal Medicine", state: "FL", drugClass: "glp1" },
];

const featuredExperts: HcpProfile[] = featuredConfig.map((expert) => ({
  id: expert.id,
  displayName: expert.name,
  specialty: expert.specialty,
  state: expert.state,
  therapeuticAreas: [expert.drugClass === "sglt2" ? "SGLT2 inhibitors" : "GLP-1 therapies", "Diabetes management"],
  topics: ["Monitoring", "Switching", "Initiation", "Tolerability"],
  conditionTags: ["Renal impairment", "Cardiovascular disease", "Diabetes", "Hepatic impairment"],
  availability: "available",
  verified: true,
  matchingConsent: true,
  contactConsent: true,
  responseReliability: 0.95,
  timezoneFit: 1,
  provenance: [
    { label: "Public registry", source: "NPPES" },
    { label: "Physician provided", source: "HCP_DECLARED" },
    { label: "Permitted for matching", source: "IMPIRICUS_INTERACTION" },
  ],
}));

export const hcpProfiles: HcpProfile[] = [...accountProfiles, ...baseHcpProfiles, ...featuredExperts];

// Explicit, strongly corroborated edges (drug class + every condition) with a
// high derived strength so a validated featured expert scores ~90%+.
const featuredExpertiseEdges: ExpertiseEdge[] = featuredConfig.flatMap((expert) => {
  const drugSources: ExpertiseSource[] = ["IMPIRICUS_SIGNAL", "SELF_DECLARED", "PUBLICATION"];
  const conditionSources: ExpertiseSource[] = ["SELF_DECLARED", "PUBLICATION"];
  return [
    { hcpId: expert.id, tagId: expert.drugClass, sources: drugSources, strength: FEATURED_STRENGTH },
    ...FEATURED_CONDITION_TAG_IDS.map((tagId): ExpertiseEdge => ({ hcpId: expert.id, tagId, sources: conditionSources, strength: FEATURED_STRENGTH })),
  ];
});

const featuredHelpProfiles: PeerHelpProfile[] = featuredConfig.map((expert) => ({
  hcpId: expert.id,
  offeredTagIds: [expert.drugClass, ...FEATURED_CONDITION_TAG_IDS],
  helpModes: ["async_question", "short_call", "referral_guidance"],
  peerSupportOptIn: true,
}));

const accountExpertiseEdges: ExpertiseEdge[] = [
  { hcpId: "hcp-maya", tagId: "sglt2", sources: ["IMPIRICUS_SIGNAL", "SELF_DECLARED"], strength: 0.9 },
  { hcpId: "hcp-maya", tagId: "glp1", sources: ["IMPIRICUS_SIGNAL", "SELF_DECLARED"], strength: 0.92 },
  { hcpId: "hcp-maya", tagId: "diabetes", sources: ["SELF_DECLARED", "SPECIALTY"], strength: 0.88 },
  { hcpId: "hcp-maya", tagId: "renal_impairment", sources: ["SELF_DECLARED", "PUBLICATION"], strength: 0.9 },
  { hcpId: "hcp-maya", tagId: "cardiovascular_disease", sources: ["SELF_DECLARED"], strength: 0.72 },
  { hcpId: "hcp-jordan", tagId: "sglt2", sources: ["IMPIRICUS_SIGNAL", "SELF_DECLARED"], strength: 0.86 },
  { hcpId: "hcp-jordan", tagId: "glp1", sources: ["IMPIRICUS_SIGNAL", "SELF_DECLARED"], strength: 0.84 },
  { hcpId: "hcp-jordan", tagId: "diabetes", sources: ["SELF_DECLARED", "SPECIALTY"], strength: 0.82 },
  { hcpId: "hcp-jordan", tagId: "cardiovascular_disease", sources: ["SELF_DECLARED"], strength: 0.74 },
];

const accountHelpProfiles: PeerHelpProfile[] = accountProfiles.map((profile) => ({
  hcpId: profile.id,
  offeredTagIds: accountExpertiseEdges.filter((edge) => edge.hcpId === profile.id).map((edge) => edge.tagId),
  helpModes: ["async_question", "short_call"],
  peerSupportOptIn: true,
}));

const shares = [18, 21, 22, 24, 25, 19, 28, 26, 23, 27, 30, 20, 24, 29, 17, 25, 26, 22];
export const prescribingStats: PrescribingStat[] = shares.map((share, index) => ({
  hcpId: index === 0 ? "hcp-maya" : `cohort-${index}`,
  classId: "sglt2",
  classLabel: "SGLT2 inhibitors",
  year: 2024,
  classShare: share / 100,
  totalClaims: 160 + index * 12,
  suppressed: false,
  specialty: "Endocrinology",
  state: index < 14 ? "GA" : "NC",
}));

export const mirrorClasses = [
  { id: "sglt2", label: "SGLT2 inhibitors", subject: 18, median: 24, q1: 19, q3: 29 },
  { id: "glp1", label: "GLP-1 receptor agonists", subject: 31, median: 29, q1: 24, q3: 35 },
  { id: "dpp4", label: "DPP-4 inhibitors", subject: 12, median: 14, q1: 9, q3: 18 },
  { id: "basal", label: "Basal insulin", subject: 22, median: 21, q1: 17, q3: 27 },
];

export const mirrorClassesByPersona: Record<string, typeof mirrorClasses> = {
  "hcp-maya": mirrorClasses,
  "hcp-jordan": [
    { id: "sglt2", label: "SGLT2 inhibitors", subject: 26, median: 23, q1: 18, q3: 28 },
    { id: "glp1", label: "GLP-1 receptor agonists", subject: 22, median: 27, q1: 23, q3: 34 },
    { id: "dpp4", label: "DPP-4 inhibitors", subject: 17, median: 14, q1: 9, q3: 19 },
    { id: "basal", label: "Basal insulin", subject: 28, median: 22, q1: 18, q3: 28 },
  ],
  "hcp-1": [
    { id: "sglt2", label: "SGLT2 inhibitors", subject: 23, median: 24, q1: 19, q3: 29 },
    { id: "glp1", label: "GLP-1 receptor agonists", subject: 34, median: 29, q1: 24, q3: 35 },
    { id: "dpp4", label: "DPP-4 inhibitors", subject: 10, median: 14, q1: 9, q3: 18 },
    { id: "basal", label: "Basal insulin", subject: 19, median: 21, q1: 17, q3: 27 },
  ],
};

export const practiceUpdates: PracticeUpdate[] = [
  {
    id: "update-sglt2-monitoring-v3",
    title: "Aurelia Pharma changed its SGLT2 formulation",
    therapeuticArea: "SGLT2 inhibitors",
    updateType: "industry_update",
    publishedAt: "2026-09-24",
    previousVersion: "Aurelia Glycera · v2: contained component X",
    currentVersion: "Aurelia Glycera · v3: contains component Y",
    changeSummary: "Aurelia Pharma replaced component X with component Y in the newer product version.",
    detail: "This synthetic, reviewed change record is a prompt for professional discussion. Relay does not decide whether a prescription should change or provide patient-specific treatment advice.",
    relevanceReasons: ["Matches your specialty", "You explored SGLT2 inhibitors in Practice Mirror"],
    audienceSpecialties: ["Endocrinology", "Internal Medicine", "Family Medicine"],
    suggestedTopics: ["Switching", "Monitoring"],
    specialistIds: ["hcp-1", "hcp-2", "hcp-7", "hcp-8"],
    provenance: [{ label: "Synthetic demo data", source: "SYNTHETIC" }],
  },
  {
    id: "update-glp1-conversation-guide-v2",
    title: "Northstar Therapeutics updated a GLP-1 ingredient",
    therapeuticArea: "GLP-1 therapies",
    updateType: "industry_update",
    publishedAt: "2026-09-19",
    previousVersion: "Northstar Luma · v1: contained component A",
    currentVersion: "Northstar Luma · v2: contains component B",
    changeSummary: "Northstar Therapeutics replaced component A with component B in the latest reviewed product version.",
    detail: "Use this update to frame a general question for specialists. The record describes a product change; it does not recommend a treatment or prescription change.",
    relevanceReasons: ["Matches your specialty", "Related to a topic available in Doctor Connect"],
    audienceSpecialties: ["Endocrinology", "Internal Medicine"],
    suggestedTopics: ["Switching", "Tolerability"],
    specialistIds: ["hcp-1", "hcp-2", "hcp-7", "hcp-8"],
    provenance: [{ label: "Synthetic demo data", source: "SYNTHETIC" }],
  },
  {
    id: "update-diabetes-resource-index-v4",
    title: "Vertex Bio revised its diabetes therapy excipient",
    therapeuticArea: "Diabetes management",
    updateType: "industry_update",
    publishedAt: "2026-09-12",
    previousVersion: "Vertex Glycera · v3: contained component M",
    currentVersion: "Vertex Glycera · v4: contains component N",
    changeSummary: "Vertex Bio changed the product excipient from component M to component N in the reviewed version.",
    detail: "This fictional update demonstrates a transparent before-and-after record for discussion with peers. It is not a clinical alert or prescribing instruction.",
    relevanceReasons: ["Matches your specialty", "Part of your followed therapeutic area"],
    audienceSpecialties: ["Endocrinology", "Internal Medicine", "Family Medicine"],
    suggestedTopics: ["Monitoring", "Switching"],
    specialistIds: ["hcp-1", "hcp-2", "hcp-7", "hcp-8"],
    provenance: [{ label: "Synthetic demo data", source: "SYNTHETIC" }],
  },
];

export const currentClientFields: AllowedField[] = [
  { fieldId: "profile.specialty", label: "NPI specialty", classification: "public", granularity: "individual", purpose: "provider_directory", retentionDays: 730 },
  { fieldId: "engagement.state_counts", label: "State engagement counts", classification: "derived", granularity: "aggregate", purpose: "campaign_measurement", retentionDays: 365, minimumGroupSize: 11 },
  { fieldId: "resources.request_counts", label: "Resource request totals", classification: "derived", granularity: "aggregate", purpose: "campaign_measurement", retentionDays: 365, minimumGroupSize: 11 },
];

// --- Synthetic prescribing vectors for peer domain clustering ---
// Each physician gets a share across five drug classes. Values are synthetic
// and generated deterministically so clustering is reproducible offline. Three
// latent "domains" are seeded so the unsupervised model has real structure to
// recover; intra-domain noise keeps physicians from being identical.

export const drugClasses: DrugClassRef[] = [
  { classId: "sglt2", classLabel: "SGLT2 inhibitors" },
  { classId: "glp1", classLabel: "GLP-1 receptor agonists" },
  { classId: "dpp4", classLabel: "DPP-4 inhibitors" },
  { classId: "basal", classLabel: "Basal insulin" },
  { classId: "metformin", classLabel: "Metformin & other orals" },
];

const drugClassOrder: DrugClassId[] = ["sglt2", "glp1", "dpp4", "basal", "metformin"];

// Base prescribing mixes for the three latent practice domains.
const domainArchetypes: Record<DrugClassId, number>[] = [
  { sglt2: 0.44, glp1: 0.16, dpp4: 0.1, basal: 0.1, metformin: 0.2 }, // SGLT2-led
  { sglt2: 0.15, glp1: 0.45, dpp4: 0.1, basal: 0.1, metformin: 0.2 }, // GLP-1-led
  { sglt2: 0.1, glp1: 0.1, dpp4: 0.3, basal: 0.3, metformin: 0.2 }, // traditional (DPP-4 + basal)
];

// Deterministic pseudo-noise in [0, 1) from two integer seeds.
function deterministicNoise(a: number, b: number): number {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function buildPrescribingProfile(hcpId: string, specialty: string, state: string, domainIndex: number, seed: number): PrescribingProfile {
  const archetype = domainArchetypes[domainIndex];
  const raw = drugClassOrder.map((classId, position) => {
    const delta = (deterministicNoise(seed + 1, position + 1) - 0.5) * 0.12;
    return Math.max(0.02, archetype[classId] + delta);
  });
  const total = raw.reduce((sum, value) => sum + value, 0);
  const classShares = drugClassOrder.reduce((acc, classId, position) => {
    acc[classId] = Number((raw[position] / total).toFixed(4));
    return acc;
  }, {} as Record<DrugClassId, number>);
  return { hcpId, specialty, state, year: 2024, classShares, totalClaims: 120 + seed * 5 };
}

export const prescribingProfiles: PrescribingProfile[] = [
  // Persona vectors are set explicitly so a physician's clustering shares match
  // the shares they see elsewhere (e.g. Practice Mirror's class snapshot).
  { hcpId: "hcp-maya", specialty: "Endocrinology", state: "GA", year: 2024, classShares: { sglt2: 0.18, glp1: 0.31, dpp4: 0.12, basal: 0.22, metformin: 0.17 }, totalClaims: 620 },
  { hcpId: "hcp-jordan", specialty: "Internal Medicine", state: "GA", year: 2024, classShares: { sglt2: 0.42, glp1: 0.14, dpp4: 0.13, basal: 0.11, metformin: 0.2 }, totalClaims: 540 },
  ...baseHcpProfiles.map((profile, index) => buildPrescribingProfile(profile.id, profile.specialty, profile.state, index % 3, index + 1)),
];

// --- Synthetic Relay Network Graph fixtures ---
// The expertise and trust graphs are derived from the existing synthetic
// physicians and their prescribing history, so matching runs on real signals
// (drug/prescribing history, declared experience, region) rather than titles.
// All data is synthetic; no patient data is present.

export const expertiseTags: ExpertiseTag[] = [
  { id: "sglt2", label: "SGLT2 inhibitors", kind: "drug_class" },
  { id: "glp1", label: "GLP-1 receptor agonists", kind: "drug_class" },
  { id: "dpp4", label: "DPP-4 inhibitors", kind: "drug_class" },
  { id: "basal", label: "Basal insulin", kind: "drug_class" },
  { id: "metformin", label: "Metformin & other orals", kind: "drug_class" },
  { id: "renal_impairment", label: "Renal impairment", kind: "condition" },
  { id: "cardiovascular_disease", label: "Cardiovascular disease", kind: "condition" },
  { id: "diabetes", label: "Diabetes", kind: "condition" },
  { id: "hepatic_impairment", label: "Hepatic impairment", kind: "condition" },
  { id: "initiation", label: "Initiation", kind: "topic" },
  { id: "monitoring", label: "Monitoring", kind: "topic" },
  { id: "switching", label: "Switching", kind: "topic" },
  { id: "tolerability", label: "Tolerability", kind: "topic" },
  { id: "emory_system", label: "Emory-affiliated (synthetic)", kind: "affiliation" },
  { id: "piedmont_network", label: "Piedmont network (synthetic)", kind: "affiliation" },
  { id: "rural_ga_clinic", label: "Rural GA clinic (synthetic)", kind: "affiliation" },
];

const conditionTagIdByLabel: Record<string, string> = {
  "Renal impairment": "renal_impairment",
  "Cardiovascular disease": "cardiovascular_disease",
  Diabetes: "diabetes",
  "Hepatic impairment": "hepatic_impairment",
};

const classIdByArea: Record<string, DrugClassId | undefined> = {
  "GLP-1 therapies": "glp1",
  "SGLT2 inhibitors": "sglt2",
  "Diabetes management": undefined,
};

const affiliationTagIds = ["emory_system", "piedmont_network", "rural_ga_clinic"];

function topPrescribedClass(profile: PrescribingProfile): DrugClassId {
  return drugClassOrder.reduce((best, classId) => (profile.classShares[classId] > profile.classShares[best] ? classId : best), drugClassOrder[0]);
}

export const expertiseEdges: ExpertiseEdge[] = [
  ...accountExpertiseEdges,
  ...baseHcpProfiles.flatMap((profile, index) => {
  const edges: ExpertiseEdge[] = [];
  const prescribing = prescribingProfiles.find((entry) => entry.hcpId === profile.id);

  if (prescribing) {
    const topClass = topPrescribedClass(prescribing);
    for (const { classId } of drugClasses) {
      const share = prescribing.classShares[classId] ?? 0;
      if (share < 0.2) continue;
      const sources: ExpertiseSource[] = ["IMPIRICUS_SIGNAL"]; // prescribing-history evidence
      if (profile.therapeuticAreas.some((area) => classIdByArea[area] === classId)) sources.push("SELF_DECLARED");
      if (index % 6 === 0 && classId === topClass) sources.push("PUBLICATION"); // standout experts
      edges.push({ hcpId: profile.id, tagId: classId, sources });
    }
  }

  for (const condition of profile.conditionTags) {
    const tagId = conditionTagIdByLabel[condition];
    if (!tagId) continue;
    const sources: ExpertiseSource[] = index % 5 === 0 ? ["SELF_DECLARED", "PUBLICATION"] : ["SELF_DECLARED"];
    edges.push({ hcpId: profile.id, tagId, sources });
  }

  for (const topic of profile.topics) {
    edges.push({ hcpId: profile.id, tagId: topic.toLowerCase(), sources: ["SELF_DECLARED"] });
  }

  edges.push({ hcpId: profile.id, tagId: affiliationTagIds[index % affiliationTagIds.length], sources: ["IMPIRICUS_SIGNAL"] });
  return edges;
  }),
  ...featuredExpertiseEdges,
];

export const peerHelpProfiles: PeerHelpProfile[] = [
  ...accountHelpProfiles,
  ...baseHcpProfiles.map((profile, index) => {
  const prescribing = prescribingProfiles.find((entry) => entry.hcpId === profile.id);
  const drugTags = drugClasses.map((entry) => entry.classId).filter((classId) => (prescribing?.classShares[classId] ?? 0) >= 0.2);
  const conditionTags = profile.conditionTags.map((label) => conditionTagIdByLabel[label]).filter((tagId): tagId is string => Boolean(tagId));
  const helpModes: HelpMode[] = [
    "async_question",
    ...(index % 2 === 0 ? (["short_call"] as HelpMode[]) : []),
    ...(index % 3 === 0 ? (["referral_guidance"] as HelpMode[]) : []),
  ];
  return {
    hcpId: profile.id,
    offeredTagIds: [...drugTags, ...conditionTags],
    helpModes,
    // A few physicians have not opted into peer support, to exercise the funnel.
    peerSupportOptIn: index % 7 !== 3,
  };
  }),
  ...featuredHelpProfiles,
];

function seedTrust(expertId: string, tagId: string, requesterIds: string[], usefulness: number): TrustEdge[] {
  return requesterIds.map((fromHcpId) => ({
    fromHcpId,
    toHcpId: expertId,
    tagId,
    interactions: 1,
    successfulConnections: 1,
    usefulnessScore: usefulness,
    lastConnectedAt: "2026-09-20T12:00:00.000Z",
  }));
}

// Seed a few validated experts so the demo starts with visible trust and the
// bandit will later have informative priors.
export const trustEdges: TrustEdge[] = [
  ...seedTrust("hcp-1", "sglt2", ["hcp-16", "hcp-19", "hcp-22", "hcp-25"], 0.95),
  ...seedTrust("hcp-1", "renal_impairment", ["hcp-16", "hcp-19"], 0.9),
  ...seedTrust("hcp-13", "sglt2", ["hcp-28", "hcp-31"], 0.8),
  ...seedTrust("hcp-13", "renal_impairment", ["hcp-28"], 0.8),
  ...seedTrust("hcp-7", "sglt2", ["hcp-34"], 0.7),
  ...seedTrust("hcp-2", "glp1", ["hcp-5", "hcp-11", "hcp-14"], 0.9),
  // Featured cross-specialty experts start with a strong, corroborated track
  // record on their drug class and diabetes, so every category shows at least
  // two ~90% matches driven by validated peer outcomes.
  ...featuredConfig.flatMap((expert) => [
    ...seedTrust(expert.id, expert.drugClass, ["hcp-16", "hcp-19", "hcp-22", "hcp-25"], 0.95),
    ...seedTrust(expert.id, "diabetes", ["hcp-28", "hcp-31", "hcp-34"], 0.92),
  ]),
];
