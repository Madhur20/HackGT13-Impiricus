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
