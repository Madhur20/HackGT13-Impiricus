import type { AccessDecision, AllowedField, HcpProfile, Purpose } from "@relay/domain";

export const POLICY_VERSION = "relay-demo-2026.09";

export function authorizeUse(input: {
  purpose: Purpose;
  candidate?: HcpProfile;
  requesterContactConsent?: boolean;
  recipientContactConsent?: boolean;
  proposedField?: AllowedField;
}): AccessDecision {
  const hits: AccessDecision["ruleHits"] = [];

  if (input.purpose === "PEER_MATCHING" && input.candidate) {
    if (!input.candidate.verified) {
      hits.push({ id: "CREDENTIAL_DEMO_001", decision: "deny", title: "Credential check required", reason: "This synthetic profile is not marked verified." });
    }
    if (!input.candidate.matchingConsent) {
      hits.push({ id: "CONSENT_MATCH_001", decision: "deny", title: "Matching consent inactive", reason: "Peer identity requires an active PEER_MATCHING grant." });
    }
    if (input.candidate.availability === "unavailable") {
      hits.push({ id: "AVAILABILITY_001", decision: "deny", title: "Peer unavailable", reason: "The physician is not accepting requests." });
    }
  }

  if (input.purpose === "PEER_CONTACT") {
    if (!input.requesterContactConsent || !input.recipientContactConsent) {
      hits.push({ id: "CONSENT_CONTACT_002", decision: "deny", title: "Mutual consent incomplete", reason: "Both physicians must actively approve the selected contact channel." });
    }
  }

  if (input.purpose === "CLIENT_DISCLOSURE" && input.proposedField) {
    hits.push({ id: "CLIENT_SCOPE_001", decision: "review", title: "New client-visible field", reason: "Internal policy requires review before a field enters an approved client scope." });
    if (input.proposedField.classification === "derived" && input.proposedField.granularity === "individual") {
      hits.push({ id: "CONSENT_003", decision: "deny", title: "Purpose grant missing", reason: "Individual derived engagement data lacks a compatible client-disclosure purpose." });
    }
    if (input.proposedField.granularity === "aggregate" && (input.proposedField.minimumGroupSize ?? 0) < 11) {
      hits.push({ id: "AGGREGATE_004", decision: "deny", title: "Aggregate threshold too small", reason: "The fictional demo policy requires a minimum group size of 11." });
    }
  }

  const decision = hits.some((hit) => hit.decision === "deny")
    ? "deny"
    : hits.some((hit) => hit.decision === "review")
      ? "review"
      : "allow";

  return { decision, policyVersion: POLICY_VERSION, ruleHits: hits };
}
