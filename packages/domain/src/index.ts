export type Role = "hcp" | "compliance";
export type Purpose =
  | "SELF_INSIGHT"
  | "PEER_MATCHING"
  | "PEER_CONTACT"
  | "AGGREGATE_ANALYTICS"
  | "CLIENT_DISCLOSURE";

export type Decision = "allow" | "deny" | "review";

export type Persona = {
  id: string;
  name: string;
  role: Role;
  subtitle: string;
  initials: string;
};

export type Provenance = {
  label: "Public registry" | "Physician provided" | "Permitted for matching" | "Aggregate benchmark" | "Synthetic demo data";
  source: "NPPES" | "CMS_PART_D" | "HCP_DECLARED" | "IMPIRICUS_INTERACTION" | "SYNTHETIC";
};

export type HcpProfile = {
  id: string;
  displayName: string;
  specialty: string;
  state: string;
  therapeuticAreas: string[];
  topics: string[];
  conditionTags: string[];
  availability: "available" | "limited" | "unavailable";
  verified: boolean;
  matchingConsent: boolean;
  contactConsent: boolean;
  responseReliability: number;
  timezoneFit: number;
  provenance: Provenance[];
};

export type QuestionSelection = {
  therapeuticArea: string;
  topic: string;
  populationBand: string;
  conditionTag: string;
};

export type MatchResult = {
  profile: HcpProfile;
  score: number;
  reasons: string[];
};

export type RuleHit = {
  id: string;
  decision: Decision;
  title: string;
  reason: string;
};

export type AccessDecision = {
  decision: Decision;
  policyVersion: string;
  ruleHits: RuleHit[];
};

export type AuditEvent = {
  id: string;
  occurredAt: string;
  actorId: string;
  product: "Mirror" | "Connect" | "Ledger" | "System";
  action: string;
  purpose: Purpose;
  policyVersion: string;
  decision: Decision;
  summary: string;
};

export type PrescribingStat = {
  hcpId: string;
  classId: string;
  classLabel: string;
  year: number;
  classShare: number;
  totalClaims: number;
  suppressed: boolean;
  specialty: string;
  state: string;
};

export type PracticeUpdate = {
  id: string;
  title: string;
  therapeuticArea: string;
  updateType: "reviewed_resource" | "practice_education" | "industry_update";
  publishedAt: string;
  previousVersion: string;
  currentVersion: string;
  changeSummary: string;
  detail: string;
  relevanceReasons: string[];
  audienceSpecialties: string[];
  suggestedTopics: string[];
  specialistIds: string[];
  provenance: Provenance[];
};

export type MirrorComparison = {
  classId: string;
  classLabel: string;
  subjectValue: number;
  cohortMedian: number;
  cohortQ1: number;
  cohortQ3: number;
  cohortSize: number;
  year: number;
  geography: string;
  usedFallback: boolean;
};

export type AllowedField = {
  fieldId: string;
  label: string;
  classification: "public" | "declared" | "derived" | "restricted";
  granularity: "individual" | "cohort" | "aggregate";
  purpose: string;
  retentionDays: number;
  minimumGroupSize?: number;
};

export type SchemaDiff = {
  operation: "ADD_FIELD" | "REMOVE_FIELD" | "CHANGE_FIELD";
  fieldId: string;
  label: string;
  before?: AllowedField;
  after?: AllowedField;
};

// --- Peer domain clustering (descriptive unsupervised grouping) ---
// These types support grouping physicians by their prescribing mix so a
// physician can see peers who practice in a similar domain. This is a
// DESCRIPTIVE overlap signal only. It does not measure expertise, quality,
// adherence, or treatment appropriateness, and it does not replace Doctor
// Connect's hard eligibility filters or transparent ranking.

export type DrugClassId = "sglt2" | "glp1" | "dpp4" | "basal" | "metformin";

export type DrugClassRef = {
  classId: DrugClassId;
  classLabel: string;
};

export type PrescribingProfile = {
  hcpId: string;
  specialty: string;
  state: string;
  year: number;
  // Fraction of the physician's tracked claims in each drug class. Values are
  // non-negative and sum to approximately 1 across the tracked classes.
  classShares: Record<DrugClassId, number>;
  totalClaims: number;
};

export type DomainCluster = {
  id: string;
  label: string;
  dominantClasses: { classId: DrugClassId; classLabel: string; share: number }[];
  centroid: Record<DrugClassId, number>;
  memberIds: string[];
  size: number;
};

export type ClusterAssignment = {
  hcpId: string;
  clusterId: string;
  distanceToCentroid: number;
};

export type DomainClusteringResult = {
  clusters: DomainCluster[];
  assignments: ClusterAssignment[];
  featureClasses: DrugClassRef[];
  iterations: number;
  seed: number;
};

export type DomainPeerSuggestion = {
  profile: HcpProfile;
  similarity: number;
  clusterId: string;
  clusterLabel: string;
  sharedDomainClasses: string[];
  reasons: string[];
};

export type SimilarPrescriberSuggestion = {
  profile: HcpProfile;
  classId: DrugClassId;
  classLabel: string;
  subjectShare: number;
  peerShare: number;
  shareDifference: number;
  similarity: number;
  reasons: string[];
};

// --- Relay Network Graph (expertise + trust matching substrate) ---
// Models physicians as a graph of expertise ("who knows what") and validated
// peer help ("who has successfully helped whom") to route an isolated physician
// to the right peer. It backs Doctor Connect matching, reuses the shared consent
// and policy foundation, and stores no patient data. See docs/network-graph-plan.md.

export type ExpertiseSource = "SELF_DECLARED" | "SPECIALTY" | "PUBLICATION" | "IMPIRICUS_SIGNAL" | "SYNTHETIC";

export type ExpertiseTagKind = "specialty" | "condition" | "drug_class" | "topic" | "skill" | "affiliation";

export type ExpertiseTag = {
  id: string;
  label: string;
  kind: ExpertiseTagKind;
};

export type ExpertiseEdge = {
  hcpId: string;
  tagId: string;
  sources: ExpertiseSource[];
  // Derived from sources when omitted; combines evidence and caps at 1.
  strength?: number;
};

export type HelpMode = "async_question" | "short_call" | "referral_guidance";

export type PeerHelpProfile = {
  hcpId: string;
  offeredTagIds: string[];
  helpModes: HelpMode[];
  peerSupportOptIn: boolean;
};

export type TrustEdge = {
  fromHcpId: string;
  toHcpId: string;
  tagId: string;
  interactions: number;
  successfulConnections: number;
  usefulnessScore: number; // 0-1 running average
  lastConnectedAt: string;
};

export type ConnectionOutcome = {
  useful: "yes" | "somewhat" | "no";
  resolution: "resolved" | "referral_needed" | "need_another_expert";
};

export type PeerNeed = {
  specialty?: string;
  expertiseTagIds: string[];
  helpMode?: HelpMode;
};

export type NetworkMatch = {
  profile: HcpProfile;
  score: number;
  expertiseScore: number;
  trustScore: number;
  trustConnections: number;
  matchedTags: { tagId: string; label: string }[];
  reasons: string[];
};

export type MatchFunnelStep = {
  label: string;
  count: number;
};

export type NetworkMatchResult = {
  need: PeerNeed;
  matches: NetworkMatch[];
  funnel: MatchFunnelStep[];
  noMatch: boolean;
};
