export { createAuditEvent as recordAuditEvent } from "@relay/audit";
export { readClientScope, readConnectCandidates, readMirrorDataset, readPracticeUpdates } from "@relay/data-broker";
export { authorizeUse, POLICY_VERSION } from "@relay/policy-engine";
export type { AccessDecision, AuditEvent, Provenance } from "@relay/domain";

export function renderProvenance(items: { label: string }[]): string[] {
  return [...new Set(items.map((item) => item.label))];
}

export function explainStructuredResult(facts: string[]): string {
  return facts.filter(Boolean).join(" ");
}
