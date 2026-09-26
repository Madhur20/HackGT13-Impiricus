import type { AuditEvent } from "@relay/domain";
import { POLICY_VERSION } from "@relay/policy-engine";

let sequence = 0;

export function createAuditEvent(input: Omit<AuditEvent, "id" | "occurredAt" | "policyVersion">): AuditEvent {
  sequence += 1;
  return {
    ...input,
    id: `audit-${String(sequence).padStart(3, "0")}`,
    occurredAt: new Date().toISOString(),
    policyVersion: POLICY_VERSION,
  };
}
