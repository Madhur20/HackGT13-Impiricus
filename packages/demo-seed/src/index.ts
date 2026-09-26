import type { AllowedField, HcpProfile, Persona, PracticeUpdate, PrescribingStat } from "@relay/domain";

export const personas: Persona[] = [
  { id: "hcp-maya", name: "Dr. Maya Chen", role: "hcp", subtitle: "Endocrinology · Atlanta, GA", initials: "MC" },
  { id: "hcp-jordan", name: "Dr. Jordan Brooks", role: "hcp", subtitle: "Internal Medicine · Decatur, GA", initials: "JB" },
];

const specialties = ["Endocrinology", "Internal Medicine", "Family Medicine"];
const states = ["GA", "GA", "GA", "NC", "FL"];
const areas = ["GLP-1 therapies", "SGLT2 inhibitors", "Diabetes management"];

export const hcpProfiles: HcpProfile[] = Array.from({ length: 36 }, (_, index) => ({
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
    specialistIds: ["hcp-1", "hcp-5", "hcp-6", "hcp-7"],
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
    specialistIds: ["hcp-1", "hcp-5", "hcp-6", "hcp-7"],
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
    specialistIds: ["hcp-1", "hcp-5", "hcp-6", "hcp-7"],
    provenance: [{ label: "Synthetic demo data", source: "SYNTHETIC" }],
  },
];

export const currentClientFields: AllowedField[] = [
  { fieldId: "profile.specialty", label: "NPI specialty", classification: "public", granularity: "individual", purpose: "provider_directory", retentionDays: 730 },
  { fieldId: "engagement.state_counts", label: "State engagement counts", classification: "derived", granularity: "aggregate", purpose: "campaign_measurement", retentionDays: 365, minimumGroupSize: 11 },
  { fieldId: "resources.request_counts", label: "Resource request totals", classification: "derived", granularity: "aggregate", purpose: "campaign_measurement", retentionDays: 365, minimumGroupSize: 11 },
];
