import { currentClientFields, hcpProfiles, practiceUpdates, prescribingProfiles, prescribingStats } from "@relay/demo-seed";
import type { AccessDecision, AllowedField, HcpProfile, PracticeUpdate, PrescribingProfile, PrescribingStat, Purpose } from "@relay/domain";
import { authorizeUse, POLICY_VERSION } from "@relay/policy-engine";

export type BrokerResult<T> = {
  data: T;
  purpose: Purpose;
  decision: AccessDecision;
};

const allowed = (): AccessDecision => ({ decision: "allow", policyVersion: POLICY_VERSION, ruleHits: [] });

export function readMirrorDataset(): BrokerResult<PrescribingStat[]> {
  return {
    data: prescribingStats.map((record) => ({ ...record })),
    purpose: "SELF_INSIGHT",
    decision: allowed(),
  };
}

export function readClusteringDataset(): BrokerResult<PrescribingProfile[]> {
  // Prescribing vectors feed a descriptive domain-clustering model. The read is
  // scoped to aggregate analytics; downstream peer suggestions still require an
  // active PEER_MATCHING grant before any physician identity is surfaced.
  return {
    data: prescribingProfiles.map((profile) => ({ ...profile, classShares: { ...profile.classShares } })),
    purpose: "AGGREGATE_ANALYTICS",
    decision: allowed(),
  };
}

export function readConnectCandidates(): BrokerResult<HcpProfile[]> {
  return {
    data: hcpProfiles
      .filter((candidate) => authorizeUse({ purpose: "PEER_MATCHING", candidate }).decision === "allow")
      .map((candidate) => ({ ...candidate, provenance: [...candidate.provenance] })),
    purpose: "PEER_MATCHING",
    decision: allowed(),
  };
}

export function readClientScope(): BrokerResult<AllowedField[]> {
  return {
    data: currentClientFields.map((field) => ({ ...field })),
    purpose: "CLIENT_DISCLOSURE",
    decision: allowed(),
  };
}

export function readPracticeUpdates(input: { actorId: string; specialty: string }): BrokerResult<PracticeUpdate[]> {
  void input.actorId;
  return {
    data: practiceUpdates
      .filter((update) => update.audienceSpecialties.includes(input.specialty))
      .map((update) => ({
        ...update,
        relevanceReasons: [...update.relevanceReasons],
        audienceSpecialties: [...update.audienceSpecialties],
        suggestedTopics: [...update.suggestedTopics],
        provenance: [...update.provenance],
      })),
    purpose: "SELF_INSIGHT",
    decision: allowed(),
  };
}
