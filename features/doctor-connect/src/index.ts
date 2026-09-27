import type { AnswerApproach, EscalationConsideration, GuardedPeerAnswer, HcpProfile, MatchResult, MonitoringConsideration, QuestionSelection, StructuredPeerAnswer } from "@relay/domain";
import { authorizeUse } from "@relay/relay-core";
import { findPersonReferences, type TextSpan } from "./person-reference";

export const QUESTION_TAXONOMY_VERSION = "connect-question-v3-free-text-guarded";
export const ANSWER_TAXONOMY_VERSION = "connect-answer-v3-guarded-free-text";
export const ANSWER_GUARDRAIL_VERSION = "connect-guardrails-v3";
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

const ISSUE_REDACTIONS: Record<Exclude<GuardrailIssueCode, "too_long" | "exact_age">, string> = {
  email: "[email removed]",
  phone: "[phone removed]",
  date: "[date removed]",
  record_id: "[identifier removed]",
  government_id: "[government ID removed]",
  street_address: "[address removed]",
  precise_location: "[location removed]",
  online_identifier: "[online identifier removed]",
  named_person: "[name removed]",
};

// Identifier values must contain a digit so ordinary phrases ("insurance coverage", "group visits", "in this case - the") pass.
const ID_VALUE = String.raw`(?=[a-z-]*\d)[a-z0-9-]`;
const piiRules: Array<{ code: Exclude<GuardrailIssueCode, "too_long" | "exact_age" | "named_person">; pattern: RegExp }> = [
  { code: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { code: "email", pattern: /\b[A-Z0-9._%+-]+\s+(?:at|\[at\])\s+[A-Z0-9.-]+\s+(?:dot|\[dot\])\s+[A-Z]{2,}\b/gi },
  { code: "phone", pattern: /(?<!\d)(?:\+?1[\s().-]*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}(?!\d)/g },
  { code: "phone", pattern: /\b(?:phone|mobile|cell|fax)\s*(?:number|no\.?|#)?\s*[:#-]?\s*\d{3}[\s.-]?\d{4}\b/gi },
  { code: "date", pattern: /\b(?:\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|(?:\d{1,2}[\/-]){2}\d{2,4})\b/g },
  { code: "date", pattern: /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b/gi },
  { code: "date", pattern: /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{4})?\b/gi },
  { code: "date", pattern: /\b(?:born|dob|date of birth|birthday)\s*(?:is|was|:)?\s*(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|[A-Za-z]+\s+\d{1,2}(?:,?\s+\d{4})?)\b/gi },
  { code: "date", pattern: /\b(?:born|birth year)\s+(?:in|is|was|:)?\s*(?:19|20)\d{2}\b/gi },
  { code: "record_id", pattern: new RegExp(String.raw`\b(?:mrn|medical record)\s*(?:number|no\.?|#|id)?\s*[:#-]?\s*${ID_VALUE}{3,}\b`, "gi") },
  { code: "record_id", pattern: new RegExp(String.raw`\b(?:chart|account|member|claim|case|policy|encounter)\s*(?:(?:number|no\.?|#|id)\s*[:#-]?|[:#-])\s*${ID_VALUE}{3,}\b`, "gi") },
  { code: "record_id", pattern: new RegExp(String.raw`\b(?:patient|pt)\s*(?:number|no\.?|#|id)\s*[:#-]?\s*${ID_VALUE}{3,}\b`, "gi") },
  { code: "record_id", pattern: new RegExp(String.raw`\b(?:npi|insurance|subscriber|beneficiary|group|medicare|medicaid)\s*(?:number|no\.?|#|id)?\s*[:#-]?\s*${ID_VALUE}{4,}\b`, "gi") },
  { code: "record_id", pattern: /\b(?:mrn|chart|account|member|claim|encounter)\s+\d{5,}\b/gi },
  { code: "record_id", pattern: /(?<![\d.,])\d{7,}(?![\d.,])/g },
  { code: "government_id", pattern: new RegExp(String.raw`\b(?:ssn|social security(?: number)?|driver'?s? licen[cs]e|passport)\s*(?:number|no\.?|#)?\s*[:#-]?\s*${ID_VALUE}{4,}\b`, "gi") },
  { code: "government_id", pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { code: "street_address", pattern: /\b\d{1,6}\s+[A-Za-z0-9.' -]{2,60}\s(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|circle|cir|parkway|pkwy|highway|hwy|way)\b(?:\s+(?:apt|apartment|suite|unit|#)\s*[A-Za-z0-9-]+)?/gi },
  { code: "street_address", pattern: /\bP\.?\s*O\.?\s+Box\s+\d{1,8}\b/gi },
  { code: "precise_location", pattern: /\b(?:zip|postal code)\s*[:#-]?\s*\d{5}(?:-\d{4})?\b/gi },
  // A named place, not a phrase such as "lives alone" or "I work at night".
  { code: "precise_location", pattern: /\b(?:[Ll]ives?|[Ll]iving|[Rr]esides?|[Rr]esiding|[Ww]orks?|[Ww]orking)\s+(?:at|on|in|near)\s+[A-Z0-9][\w.'&-]*(?:\s+[A-Z0-9][\w.'&-]*){0,5}/g },
  { code: "online_identifier", pattern: /\bhttps?:\/\/\S+|\bwww\.\S+|(?<!\w)@[A-Za-z0-9_]{2,30}\b|\b(?:\d{1,3}\.){3}\d{1,3}\b/gi },
];

// An age is exact only with age wording ("72-year-old", "72 yo", "age 72"). Durations ("for 2 years") and ranges ("aged 65 and older", "18-39 years old") pass.
const AGE_NUMBER = String.raw`(?:[1-9]\d?|1[01]\d|120)`;
const exactAgePhrase = new RegExp(String.raw`(?<!(?:over|under|than|least|most|[<>≥≤]|\d\s*(?:-|–|—|to))\s*)\b(?:age[d]?\s*[:#-]?\s*${AGE_NUMBER}\b(?!\s*(?:\+|-|–|—|to\s+\d|and\s+(?:older|over|up|above|under|younger)|or\s+(?:older|over|more|above|younger|under)))|${AGE_NUMBER}\s*(?:[- ]?(?:years?|yrs?)[- ]old\b|[- ]?y\/?o\b|(?:years?|yrs?)\s+of\s+age\b))`, "gi");

type RedactionSpan = TextSpan & { label: string };

function matchSpans(pattern: RegExp, input: string): TextSpan[] {
  return [...input.matchAll(pattern)].map((match) => ({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length }));
}

function applyRedactions(input: string, spans: RedactionSpan[]): string {
  let output = "";
  let cursor = 0;
  for (const span of [...spans].sort((a, b) => a.start - b.start || b.end - a.end)) {
    if (span.start < cursor) continue;
    output += input.slice(cursor, span.start) + span.label;
    cursor = span.end;
  }
  return output + input.slice(cursor);
}

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
  const spans: RedactionSpan[] = [];
  const flag = (code: Exclude<GuardrailIssueCode, "too_long" | "exact_age">, found: TextSpan[]) => {
    if (!found.length) return;
    issues.push(code);
    spans.push(...found.map((span) => ({ ...span, label: ISSUE_REDACTIONS[code] })));
  };
  for (const rule of piiRules) flag(rule.code, matchSpans(rule.pattern, input));
  flag("named_person", findPersonReferences(input));
  const exactAge = field === "populationBand" ? exactAgeFromAgeField(input) : null;
  const agePhrases = matchSpans(exactAgePhrase, input);
  const hasAgePhrase = agePhrases.length > 0;
  const hasBareAgeNumber = /\b(?:[1-9]\d?|1[01]\d|120)\b/.test(input);
  const isGeneralAgeDescription = /\b(?:adults?|children|adolescents?|pediatric|older|younger|under|over|aged|age range)\b/i.test(input)
    || /\b\d{1,3}\s*(?:-|–|—|to)\s*\d{1,3}\b/.test(input)
    || /\b\d{1,3}\s*\+/.test(input);
  const containsExactAge = hasAgePhrase
    || (/^\s*\d{1,3}\s*$/.test(input) && exactAge === null)
    || (field === "populationBand" && exactAge === null && hasBareAgeNumber && !isGeneralAgeDescription);
  if (field !== "populationBand" && containsExactAge) {
    issues.push("exact_age");
    spans.push(...agePhrases.map((span) => ({ ...span, label: "[age generalized]" })));
    if (/^\s*\d{1,3}\s*$/.test(input)) spans.push({ start: 0, end: input.length, label: "[age generalized]" });
  } else if (field === "populationBand" && containsExactAge && exactAge === null) {
    issues.push("exact_age");
  }
  if (input.length > QUESTION_LIMITS[field]) issues.push("too_long");
  const redactedPreview = applyRedactions(input, spans);
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

// The responder still writes one capped free-text answer. These labelled lines are an editable
// scaffold inside that text, not separate stored fields, so the same guardrail review covers all of it.
export type AnswerSectionId = "approach" | "monitoring" | "escalation" | "context";
export type AnswerSection = { id: AnswerSectionId; label: string; required: boolean; prompt: string; separator: string; suggestions: readonly string[]; exclusive: boolean };
export type ParsedAnswerSection = { id: AnswerSectionId; label: string; value: string };

export const ANSWER_SECTIONS: readonly AnswerSection[] = [
  { id: "approach", label: "Approach", required: true, prompt: "How you generally approach this situation", separator: "; ", suggestions: ANSWER_APPROACHES, exclusive: false },
  { id: "monitoring", label: "Monitoring", required: true, prompt: "What you track and how often", separator: ", ", suggestions: MONITORING_CONSIDERATIONS, exclusive: false },
  { id: "escalation", label: "Escalation", required: true, prompt: "When you involve a specialist or the care team", separator: "; ", suggestions: ESCALATION_CONSIDERATIONS, exclusive: true },
  { id: "context", label: "Additional context", required: false, prompt: "Caveats, practice-setting notes, or what you would watch for", separator: "; ", suggestions: [], exclusive: false },
];

const sectionLinePattern = new RegExp(`^\\s*(${ANSWER_SECTIONS.map((section) => section.label).join("|")})\\s*:[ \\t]*(.*)$`, "i");

function sectionForLabel(label: string) {
  return ANSWER_SECTIONS.find((section) => section.label.toLowerCase() === label.toLowerCase());
}

export function buildAnswerTemplate(): string {
  return ANSWER_SECTIONS.map((section) => `${section.label}: `).join("\n");
}

type AnswerLayout = { preamble: string[]; blocks: Array<{ id: AnswerSectionId; lines: string[] }> };

function layoutAnswer(text: string): AnswerLayout {
  const layout: AnswerLayout = { preamble: [], blocks: [] };
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(sectionLinePattern);
    const section = match ? sectionForLabel(match[1]) : undefined;
    if (match && section) layout.blocks.push({ id: section.id, lines: [match[2]] });
    else if (layout.blocks.length) layout.blocks[layout.blocks.length - 1].lines.push(line);
    else layout.preamble.push(line);
  }
  return layout;
}

function blockValue(lines: string[]) {
  return lines.map((line) => line.trimEnd()).join("\n").trim();
}

/** Returns labelled sections in written order, or null when the answer does not use the scaffold. */
export function parseAnswerSections(text: string): { preamble: string; sections: ParsedAnswerSection[] } | null {
  const layout = layoutAnswer(text);
  if (!layout.blocks.length) return null;
  return {
    preamble: blockValue(layout.preamble),
    sections: layout.blocks.map((block) => ({ id: block.id, label: ANSWER_SECTIONS.find((section) => section.id === block.id)!.label, value: blockValue(block.lines) })),
  };
}

export function readAnswerSection(text: string, id: AnswerSectionId): string | undefined {
  return parseAnswerSections(text)?.sections.find((section) => section.id === id)?.value;
}

export function writeAnswerSection(text: string, id: AnswerSectionId, value: string): string {
  const section = ANSWER_SECTIONS.find((candidate) => candidate.id === id)!;
  const layout = layoutAnswer(text);
  const index = layout.blocks.findIndex((block) => block.id === id);
  if (index >= 0) layout.blocks[index] = { id, lines: [value] };
  else {
    // Keep the canonical order when a physician deleted a heading and a suggestion restores it.
    const order = ANSWER_SECTIONS.findIndex((candidate) => candidate.id === id);
    const insertAt = layout.blocks.findIndex((block) => ANSWER_SECTIONS.findIndex((candidate) => candidate.id === block.id) > order);
    layout.blocks.splice(insertAt < 0 ? layout.blocks.length : insertAt, 0, { id, lines: [value] });
  }
  const preamble = layout.preamble.join("\n").trimEnd();
  const body = layout.blocks.map((block) => {
    const label = ANSWER_SECTIONS.find((candidate) => candidate.id === block.id)!.label;
    const [first, ...rest] = block.lines;
    return [`${label}: ${first}`.trimEnd(), ...rest].join("\n").trimEnd();
  }).join("\n");
  return preamble ? `${preamble}\n${body}` : body;
}

function splitSectionItems(value: string, separator: string) {
  const delimiter = separator.trim() === "," ? /\s*,\s*/ : /\s*;\s*/;
  return value.replace(/\.\s*$/, "").split(delimiter).map((item) => item.trim()).filter(Boolean);
}

export function answerSectionHasSuggestion(text: string, id: AnswerSectionId, suggestion: string): boolean {
  const section = ANSWER_SECTIONS.find((candidate) => candidate.id === id)!;
  return splitSectionItems(readAnswerSection(text, id) ?? "", section.separator).some((item) => item.toLowerCase() === suggestion.toLowerCase());
}

/** Adds or removes one suggested phrase in a section while preserving anything the physician typed. */
export function toggleAnswerSuggestion(text: string, id: AnswerSectionId, suggestion: string): string {
  const section = ANSWER_SECTIONS.find((candidate) => candidate.id === id)!;
  const items = splitSectionItems(readAnswerSection(text, id) ?? "", section.separator);
  const selected = items.some((item) => item.toLowerCase() === suggestion.toLowerCase());
  const next = selected
    ? items.filter((item) => item.toLowerCase() !== suggestion.toLowerCase())
    : [...(section.exclusive ? items.filter((item) => !section.suggestions.some((option) => option.toLowerCase() === item.toLowerCase())) : items), suggestion];
  return writeAnswerSection(text, id, next.join(section.separator));
}

/** Required scaffold headings that are still present but have no content. */
export function incompleteAnswerSections(text: string): AnswerSectionId[] {
  const parsed = parseAnswerSections(text);
  if (!parsed) return [];
  return ANSWER_SECTIONS.filter((section) => section.required && parsed.sections.some((candidate) => candidate.id === section.id && !candidate.value)).map((section) => section.id);
}

/** Drops blank optional headings and trailing spaces; the result is shown in the draft before review. */
export function tidyAnswerDraft(text: string): string {
  const parsed = parseAnswerSections(text);
  if (!parsed) return text.trim();
  const optionalBlank = new Set(ANSWER_SECTIONS.filter((section) => !section.required).map((section) => section.id));
  const body = parsed.sections
    .filter((section) => section.value || !optionalBlank.has(section.id))
    .map((section) => `${section.label}: ${section.value}`.trimEnd())
    .join("\n");
  return parsed.preamble ? `${parsed.preamble}\n${body}` : body;
}

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

/** Display form of a legacy enum-built answer using the same labelled lines as the free-text scaffold. */
export function structuredAnswerDisplayText(answer: Omit<StructuredPeerAnswer, "answeredAt" | "taxonomyVersion">): string {
  if (!isValidStructuredAnswer(answer)) throw new Error("Doctor Connect rejected an answer value outside the governed vocabulary.");
  return `Approach: ${answer.approach}\nMonitoring: ${answer.monitoring.join(", ")}\nEscalation: ${answer.escalation}`;
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
