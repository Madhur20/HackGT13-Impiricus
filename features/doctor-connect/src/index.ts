import type { AnswerApproach, EscalationConsideration, GuardedPeerAnswer, HcpProfile, MatchResult, MonitoringConsideration, QuestionSelection, StructuredPeerAnswer } from "@relay/domain";
import { authorizeUse } from "@relay/relay-core";

export const QUESTION_TAXONOMY_VERSION = "connect-question-v3-free-text-guarded";
export const ANSWER_TAXONOMY_VERSION = "connect-answer-v3-guarded-free-text";
export const ANSWER_GUARDRAIL_VERSION = "connect-guardrails-v2";
export const ANSWER_TEXT_LIMIT = 700;

export type QuestionField = keyof QuestionSelection;
export type GuardrailIssueCode = "email" | "phone" | "date" | "record_id" | "government_id" | "street_address" | "precise_location" | "online_identifier" | "named_person" | "exact_age" | "too_long";
export type FieldGuardrailReview = { status: "ready" | "needs_changes"; issues: GuardrailIssueCode[]; redactedPreview: string; reviewedValue: string; generalized: boolean };
export type QuestionGuardrailReview = { status: "ready" | "needs_changes"; fields: Record<QuestionField, FieldGuardrailReview>; approvedSelection: QuestionSelection; safetyStop: boolean };
export type AnswerGuardrailReview = FieldGuardrailReview & { safetyStop: boolean };

const QUESTION_LIMITS: Record<QuestionField, number> = { topic: 120, therapeuticArea: 100, populationBand: 40, conditionTag: 120 };
const ISSUE_LABELS: Record<GuardrailIssueCode, string> = {
  email: "email address",
  phone: "phone number",
  date: "exact date",
  record_id: "record or account identifier",
  government_id: "government identifier",
  street_address: "street address",
  precise_location: "specific location",
  online_identifier: "web or social identifier",
  named_person: "patient or named-person reference",
  exact_age: "specific age outside the age field",
  too_long: "text longer than this field allows",
};

const COMMON_FIRST_NAMES = [
  "alex", "alice", "amanda", "amy", "andrew", "anna", "anthony", "ashley", "barbara", "ben", "benjamin", "bob", "brian", "carol", "charles", "chris", "christopher", "daniel", "david", "deborah", "elena", "elizabeth", "emily", "emma", "eric", "frank", "george", "helen", "james", "jane", "jennifer", "jessica", "john", "jose", "joseph", "josh", "jordan", "karen", "kevin", "laura", "linda", "lisa", "maria", "mark", "mary", "matthew", "maya", "michael", "michelle", "nancy", "nicole", "patricia", "paul", "peter", "rachel", "rebecca", "richard", "robert", "sarah", "steven", "susan", "thomas", "william",
];
const commonClinicalNamePattern = new RegExp(`\\b(?:${COMMON_FIRST_NAMES.join("|")})(?:\\s+[A-Za-z][a-z]{1,30})?(?=\\s*(?:,\\s*)?(?:has|had|is|was|takes|uses|started|stopped|reports|presented|needs|developed|experiences|with|who|age[d]?\\s*\\d|\\d{1,3}[- ]?years?[- ]?old)\\b)`, "gi");
const commonIntroducedNamePattern = new RegExp(`\\b(?:(?:my|our|the)\\s+patient|patient|pt|member|(?:my|the|his|her|their)\\s+(?:mother|father|mom|dad|wife|husband|son|daughter|sister|brother|partner))\\s+(?:is\\s+|named\\s+)?(?:${COMMON_FIRST_NAMES.join("|")})(?:\\s+[A-Za-z][a-z]{1,30})?\\b`, "gi");
const commonPossessiveNamePattern = new RegExp(`\\b(?:${COMMON_FIRST_NAMES.join("|")})(?:\\s+[A-Za-z][a-z]{1,30})?['’]s(?=\\s+(?:condition|diagnosis|symptoms?|medication|treatment|therapy|labs?|results?|renal|kidney|ckd|hepatic|liver|cardiac|heart|diabetes|impairment))\\b`, "gi");
const commonTrailingNamePattern = new RegExp(`\\b(?:for|about|regarding|concerning|in|of)\\s+(?:patient\\s+)?(?:${COMMON_FIRST_NAMES.join("|")})(?:\\s+[A-Za-z][a-z]{1,30})?\\b`, "gi");
const commonSeparatedNamePattern = new RegExp(`\\b(?:${COMMON_FIRST_NAMES.join("|")})(?:\\s+[A-Za-z][a-z]{1,30})?(?=\\s*(?::|—|-)\\s*(?:renal|kidney|ckd|hepatic|liver|cardiac|heart|diabetes|impairment|monitoring|dosing|titration|side effect))`, "gi");
const REDACTION_TOKENS: Record<Exclude<GuardrailIssueCode, "too_long" | "exact_age">, string> = {
  email: "⟪EMAIL⟫",
  phone: "⟪PHONE⟫",
  date: "⟪DATE⟫",
  record_id: "⟪RECORD_ID⟫",
  government_id: "⟪GOVERNMENT_ID⟫",
  street_address: "⟪ADDRESS⟫",
  precise_location: "⟪LOCATION⟫",
  online_identifier: "⟪ONLINE_ID⟫",
  named_person: "⟪NAME⟫",
};
const REDACTION_LABELS: Record<string, string> = {
  "⟪EMAIL⟫": "[email removed]",
  "⟪PHONE⟫": "[phone removed]",
  "⟪DATE⟫": "[date removed]",
  "⟪RECORD_ID⟫": "[identifier removed]",
  "⟪GOVERNMENT_ID⟫": "[government ID removed]",
  "⟪ADDRESS⟫": "[address removed]",
  "⟪LOCATION⟫": "[location removed]",
  "⟪ONLINE_ID⟫": "[online identifier removed]",
  "⟪NAME⟫": "[name removed]",
};

const piiRules: Array<{ code: Exclude<GuardrailIssueCode, "too_long" | "exact_age">; pattern: RegExp; replacement: string }> = [
  { code: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replacement: "[email removed]" },
  { code: "email", pattern: /\b[A-Z0-9._%+-]+\s+(?:at|\[at\])\s+[A-Z0-9.-]+\s+(?:dot|\[dot\])\s+[A-Z]{2,}\b/gi, replacement: "[email removed]" },
  { code: "phone", pattern: /(?<!\d)(?:\+?1[\s().-]*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}(?!\d)/g, replacement: "[phone removed]" },
  { code: "phone", pattern: /\b(?:phone|mobile|cell|fax)\s*(?:number|no\.?|#)?\s*[:#-]?\s*\d{3}[\s.-]?\d{4}\b/gi, replacement: "[phone removed]" },
  { code: "date", pattern: /\b(?:\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|(?:\d{1,2}[\/-]){2}\d{2,4})\b/g, replacement: "[date removed]" },
  { code: "date", pattern: /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b/gi, replacement: "[date removed]" },
  { code: "date", pattern: /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{4})?\b/gi, replacement: "[date removed]" },
  { code: "date", pattern: /\b(?:born|dob|date of birth|birthday)\s*(?:is|was|:)?\s*(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|[A-Za-z]+\s+\d{1,2}(?:,?\s+\d{4})?)\b/gi, replacement: "[date removed]" },
  { code: "date", pattern: /\b(?:born|birth year)\s+(?:in|is|was|:)?\s*(?:19|20)\d{2}\b/gi, replacement: "[date removed]" },
  { code: "record_id", pattern: /\b(?:mrn|medical record)\s*(?:number|no\.?|#|id)?\s*[:#-]?\s*[a-z0-9-]{3,}\b/gi, replacement: "[identifier removed]" },
  { code: "record_id", pattern: /\b(?:chart|account|member|claim|case|policy|encounter)\s*(?:(?:number|no\.?|#|id)\s*[:#-]?|[:#-]\s*)[a-z0-9-]{3,}\b/gi, replacement: "[identifier removed]" },
  { code: "record_id", pattern: /\bpatient\s*(?:number|no\.?|#|id)\s*[:#-]?\s*[a-z0-9-]{3,}\b/gi, replacement: "[identifier removed]" },
  { code: "record_id", pattern: /\b(?:npi|insurance|subscriber|beneficiary|group)\s*(?:number|no\.?|#|id)?\s*[:#-]?\s*[a-z0-9-]{4,}\b/gi, replacement: "[identifier removed]" },
  { code: "government_id", pattern: /\b(?:ssn|social security(?: number)?|driver'?s? licen[cs]e|passport)\s*(?:number|no\.?|#)?\s*[:#-]?\s*[a-z0-9-]{4,}\b/gi, replacement: "[government ID removed]" },
  { code: "government_id", pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[government ID removed]" },
  { code: "street_address", pattern: /\b\d{1,6}\s+[A-Za-z0-9.' -]{2,60}\s(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|circle|cir|parkway|pkwy|highway|hwy|way)\b(?:\s+(?:apt|apartment|suite|unit|#)\s*[A-Za-z0-9-]+)?/gi, replacement: "[address removed]" },
  { code: "street_address", pattern: /\bP\.?\s*O\.?\s+Box\s+\d{1,8}\b/gi, replacement: "[address removed]" },
  { code: "precise_location", pattern: /\b(?:zip|postal code)\s*[:#-]?\s*\d{5}(?:-\d{4})?\b/gi, replacement: "[location removed]" },
  { code: "precise_location", pattern: /\b(?:lives?|resides?|works?)\s+(?:at|on)\s+[A-Za-z0-9.' -]{3,80}\b/gi, replacement: "[location removed]" },
  { code: "online_identifier", pattern: /\bhttps?:\/\/\S+|\bwww\.\S+|(?<!\w)@[A-Za-z0-9_]{2,30}\b|\b(?:\d{1,3}\.){3}\d{1,3}\b/gi, replacement: "[online identifier removed]" },
  { code: "named_person", pattern: /\b(?:patient|person)\s+(?:named|called|is)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/gi, replacement: "[name removed]" },
  { code: "named_person", pattern: /\b(?:Mr|Mrs|Ms|Miss|Mx|Dr)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g, replacement: "[name removed]" },
  { code: "named_person", pattern: /\b(?:my|our|the)\s+patient\s+(?:is\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g, replacement: "[patient name removed]" },
  { code: "named_person", pattern: /\b(?:patient|pt|member)\s*[:#-]?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g, replacement: "[patient name removed]" },
  { code: "named_person", pattern: /\b(?:my|the|his|her|their)\s+(?:mother|father|mom|dad|wife|husband|son|daughter|sister|brother|partner)\s+(?:is\s+|named\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g, replacement: "[person name removed]" },
  { code: "named_person", pattern: /\b[A-Z][a-z]{1,30}(?:\s+[A-Z][a-z]{1,30})?(?=\s+(?:has|had|is|was|takes|uses|started|stopped|reports|reported|presents|presented|needs|needed|developed|experiences|experienced)\b)/g, replacement: "[name removed]" },
  { code: "named_person", pattern: /\b[A-Z][a-z]{1,30}(?:\s+[A-Z][a-z]{1,30})?['’]s(?=\s+(?:[Cc]ondition|[Dd]iagnosis|[Ss]ymptoms?|[Mm]edication|[Tt]reatment|[Ll]abs?|[Rr]esults?|[Rr]enal|[Kk]idney|CKD|[Hh]epatic|[Ll]iver|[Cc]ardiac|[Hh]eart|[Dd]iabetes|[Ii]mpairment))\b/g, replacement: "[name removed]'s" },
  { code: "named_person", pattern: /\b(?:for|about|regarding|concerning|in|of)\s+(?:patient\s+)?[A-Z][a-z]{1,30}(?:\s+[A-Z][a-z]{1,30})?(?=\s+(?:who|with|because|after|before|—|-|,|\.|$))/g, replacement: "for [name removed]" },
  { code: "named_person", pattern: /\b(?:patient|pt)\s+(?:[A-Z]\.?){1,4}\b/g, replacement: "[patient initials removed]" },
  { code: "named_person", pattern: commonClinicalNamePattern, replacement: "[name removed]" },
  { code: "named_person", pattern: commonIntroducedNamePattern, replacement: "[name removed]" },
  { code: "named_person", pattern: commonPossessiveNamePattern, replacement: "[name removed]" },
  { code: "named_person", pattern: commonTrailingNamePattern, replacement: "[name removed]" },
  { code: "named_person", pattern: commonSeparatedNamePattern, replacement: "[name removed]" },
];

const exactAgePhrase = /\b(?:age[d]?\s*[:#-]?\s*)?(?:[1-9]\d?|1[01]\d|120)\s*(?:[- ]?years?(?:[- ]old)?|[- ]?yrs?(?:[- ]old)?|y\/?o)\b/gi;

export function ageToPopulationBand(age: number): string | null {
  if (!Number.isInteger(age) || age < 0 || age > 120) return null;
  if (age < 18) return "Children and adolescents under 18";
  if (age < 40) return "Adults 18–39";
  if (age < 65) return "Adults 40–64";
  if (age < 90) return "Adults 65–89";
  return "Adults 90+";
}

function exactAgeFromAgeField(input: string): number | null {
  const match = input.trim().match(/^(?:age[d]?\s*[:#-]?\s*)?(\d{1,3})(?:\s*(?:[- ]?years?(?:[- ]old)?|[- ]?yrs?(?:[- ]old)?|y\/?o))?$/i);
  if (!match) return null;
  const age = Number(match[1]);
  return ageToPopulationBand(age) ? age : null;
}

export function guardrailIssueLabel(code: GuardrailIssueCode) {
  return ISSUE_LABELS[code];
}

export function reviewQuestionField(field: QuestionField, input: string): FieldGuardrailReview {
  const issues: GuardrailIssueCode[] = [];
  let redactedPreview = input;
  for (const rule of piiRules) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(input) && !issues.includes(rule.code)) issues.push(rule.code);
    rule.pattern.lastIndex = 0;
    redactedPreview = redactedPreview.replace(rule.pattern, REDACTION_TOKENS[rule.code]);
  }
  for (const [token, label] of Object.entries(REDACTION_LABELS)) redactedPreview = redactedPreview.replaceAll(token, label);
  const exactAge = field === "populationBand" ? exactAgeFromAgeField(input) : null;
  exactAgePhrase.lastIndex = 0;
  const hasAgePhrase = exactAgePhrase.test(input);
  exactAgePhrase.lastIndex = 0;
  const hasBareAgeNumber = /\b(?:[1-9]\d?|1[01]\d|120)\b/.test(input);
  const isGeneralAgeDescription = /\b(?:adults?|children|adolescents?|pediatric|older|younger|under|over|aged|age range)\b/i.test(input)
    || /\b\d{1,3}\s*(?:-|–|—|to)\s*\d{1,3}\b/.test(input)
    || /\b\d{1,3}\s*\+/.test(input);
  const containsExactAge = hasAgePhrase
    || (/^\s*\d{1,3}\s*$/.test(input) && exactAge === null)
    || (field === "populationBand" && exactAge === null && hasBareAgeNumber && !isGeneralAgeDescription);
  if (field !== "populationBand" && containsExactAge) {
    issues.push("exact_age");
    redactedPreview = redactedPreview.replace(exactAgePhrase, "[age generalized]");
    if (/^\s*\d{1,3}\s*$/.test(redactedPreview)) redactedPreview = "[age generalized]";
  } else if (field === "populationBand" && containsExactAge && exactAge === null) {
    issues.push("exact_age");
  }
  if (input.length > QUESTION_LIMITS[field]) issues.push("too_long");
  const reviewedValue = exactAge === null ? input.trim() : ageToPopulationBand(exactAge) ?? input.trim();
  return { status: issues.length ? "needs_changes" : "ready", issues: [...new Set(issues)], redactedPreview, reviewedValue, generalized: reviewedValue !== input.trim() };
}

export function reviewQuestionSelection(selection: QuestionSelection): QuestionGuardrailReview {
  const fields = Object.fromEntries((Object.keys(selection) as QuestionField[]).map((field) => [field, reviewQuestionField(field, selection[field])])) as Record<QuestionField, FieldGuardrailReview>;
  const approvedSelection = Object.fromEntries((Object.keys(fields) as QuestionField[]).map((field) => [field, fields[field].reviewedValue])) as QuestionSelection;
  const safetyText = `${selection.topic} ${selection.conditionTag}`.toLowerCase();
  const safetyStop = /\b(?:suspected safety event|adverse event|product complaint|patient died|death)\b/.test(safetyText);
  return { status: Object.values(fields).every((field) => field.status === "ready") ? "ready" : "needs_changes", fields, approvedSelection, safetyStop };
}

export function reviewAnswerText(input: string): AnswerGuardrailReview {
  const fieldReview = reviewQuestionField("topic", input);
  const issues: GuardrailIssueCode[] = fieldReview.issues.filter((issue) => issue !== "too_long");
  if (input.length > ANSWER_TEXT_LIMIT) issues.push("too_long");
  const safetyStop = /\b(?:suspected safety event|adverse event|product complaint|patient died|death)\b/i.test(input);
  return {
    ...fieldReview,
    status: issues.length ? "needs_changes" : "ready",
    issues: [...new Set(issues)],
    reviewedValue: input.trim(),
    generalized: false,
    safetyStop,
  };
}

export function prepareAnswerText(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error("Doctor Connect requires an answer before review.");
  const review = reviewAnswerText(value);
  if (review.status !== "ready" || review.safetyStop) throw new Error("Doctor Connect rejected an answer that requires privacy or safety changes.");
  return review.reviewedValue;
}

export function isCompleteQuestionSelection(value: unknown): value is QuestionSelection {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<QuestionField, unknown>;
  return (["topic", "therapeuticArea", "populationBand", "conditionTag"] as QuestionField[]).every((field) => typeof candidate[field] === "string" && candidate[field].trim().length > 0);
}

export function assertSafeQuestionSelection(value: unknown): asserts value is QuestionSelection {
  if (!isCompleteQuestionSelection(value)) throw new Error("Doctor Connect requires all question fields.");
  const review = reviewQuestionSelection(value);
  if (review.status !== "ready" || review.safetyStop) throw new Error("Doctor Connect rejected a question that requires privacy or safety changes.");
}

export function prepareQuestionSelection(value: unknown): QuestionSelection {
  assertSafeQuestionSelection(value);
  return reviewQuestionSelection(value).approvedSelection;
}

export function inferMatchingTagIds(selection: QuestionSelection): string[] {
  const text = `${selection.therapeuticArea} ${selection.topic} ${selection.conditionTag}`.toLowerCase();
  const tags = new Set<string>();
  if (/\b(?:sglt ?2|jardiance|farxiga|invokana)\b/.test(text)) tags.add("sglt2");
  if (/\b(?:glp[- ]?1|ozempic|wegovy|mounjaro)\b/.test(text)) tags.add("glp1");
  if (/\b(?:diabetes|diabetic|glycemic|a1c)\b/.test(text)) tags.add("diabetes");
  if (/\b(?:renal|kidney|ckd)\b/.test(text)) tags.add("renal_impairment");
  if (/\b(?:cardiac|cardiovascular|heart|cvd)\b/.test(text)) tags.add("cardiovascular_disease");
  if (/\b(?:hepatic|liver)\b/.test(text)) tags.add("hepatic_impairment");
  return [...tags];
}

export const ANSWER_APPROACHES: readonly AnswerApproach[] = [
  "Review baseline context and monitoring cadence",
  "Confirm treatment goals and relevant comorbidities",
  "Coordinate a focused care-team review",
  "Consider dosing or titration factors",
  "Consider additional testing",
  "No change indicated from the available context",
];

export const MONITORING_CONSIDERATIONS: readonly MonitoringConsideration[] = ["Renal trend", "Tolerance", "Volume status", "Follow-up cadence", "Glycemic control", "Blood pressure", "Weight trend", "Laboratory frequency"];
export const ESCALATION_CONSIDERATIONS: readonly EscalationConsideration[] = ["No escalation needed", "Specialist or care-team review", "Urgent referral", "Reassess at the next follow-up"];

export function assembleQuestion(selection: QuestionSelection): string {
  const approved = prepareQuestionSelection(selection);
  return `How do peers approach ${approved.topic} for ${approved.therapeuticArea} in ${approved.populationBand} patients with ${approved.conditionTag}?`;
}

export function isValidStructuredAnswer(answer: unknown): answer is Omit<StructuredPeerAnswer, "answeredAt" | "taxonomyVersion"> {
  if (!answer || typeof answer !== "object") return false;
  const candidate = answer as Partial<StructuredPeerAnswer>;
  return typeof candidate.approach === "string"
    && ANSWER_APPROACHES.includes(candidate.approach as AnswerApproach)
    && Array.isArray(candidate.monitoring)
    && candidate.monitoring.length > 0
    && candidate.monitoring.every((item) => MONITORING_CONSIDERATIONS.includes(item))
    && typeof candidate.escalation === "string"
    && ESCALATION_CONSIDERATIONS.includes(candidate.escalation as EscalationConsideration);
}

export function assembleStructuredAnswer(answer: Omit<StructuredPeerAnswer, "answeredAt" | "taxonomyVersion">): string {
  if (!isValidStructuredAnswer(answer)) throw new Error("Doctor Connect rejected an answer value outside the governed vocabulary.");
  return `Approach: ${answer.approach}. Monitoring: ${answer.monitoring.join(", ")}. Escalation: ${answer.escalation}.`;
}

export function isGuardedPeerAnswer(answer: unknown): answer is GuardedPeerAnswer {
  if (!answer || typeof answer !== "object") return false;
  const candidate = answer as Partial<GuardedPeerAnswer>;
  return typeof candidate.responseText === "string" && candidate.responseText.trim().length > 0;
}

export function rankEligiblePeers(selection: QuestionSelection, candidates: HcpProfile[]): MatchResult[] {
  return candidates
    .filter((candidate) => authorizeUse({ purpose: "PEER_MATCHING", candidate }).decision === "allow")
    .map((profile) => {
      const area = profile.therapeuticAreas.includes(selection.therapeuticArea) || (selection.therapeuticArea === "GLP-1 receptor agonists" && profile.therapeuticAreas.includes("GLP-1 therapies")) ? 1 : 0;
      const topicAliases = selection.topic === "Dosing and titration" ? ["Initiation"] : selection.topic === "Switching therapy" ? ["Switching"] : selection.topic === "Side-effect management" ? ["Tolerability"] : [selection.topic];
      const topic = topicAliases.some((candidate) => profile.topics.includes(candidate)) ? 1 : 0;
      const condition = profile.conditionTags.includes(selection.conditionTag) ? 1 : 0;
      const specialty = profile.specialty === "Endocrinology" ? 1 : 0.72;
      const availability = profile.availability === "available" ? 1 : 0.65;
      const score = area * 0.35 + topic * 0.25 + condition * 0.15 + specialty * 0.1 + profile.responseReliability * 0.1 + profile.timezoneFit * availability * 0.05;
      const reasons = [
        area ? `Opted in to ${selection.therapeuticArea} questions` : "Related therapeutic-area experience",
        condition ? `Physician-provided experience with ${selection.conditionTag.toLowerCase()}` : `${profile.specialty} specialty fit`,
        profile.availability === "available" ? "Available this week with a strong response record" : "Limited availability with a strong response record",
      ];
      return { profile, score, reasons };
    })
    .filter((result) => result.score >= 0.62)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
