import { currentClientFields, expertiseEdges, expertiseTags, hcpProfiles, peerHelpProfiles, practiceUpdates, prescribingProfiles, prescribingStats, trustEdges } from "@relay/demo-seed";
import type { AccessDecision, AllowedField, ExpertiseEdge, ExpertiseTag, HcpProfile, PeerHelpProfile, PracticeUpdate, PrescribingProfile, PrescribingStat, Purpose, TrustEdge } from "@relay/domain";

export type NetworkGraphData = {
  tags: ExpertiseTag[];
  expertiseEdges: ExpertiseEdge[];
  peerHelpProfiles: PeerHelpProfile[];
  trustEdges: TrustEdge[];
};
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

export function readNetworkGraph(): BrokerResult<NetworkGraphData> {
  // The Network Graph backs peer matching. Fresh copies are returned so the
  // learning loop can update trust edges without mutating the seed. Peer
  // identity is still gated by PEER_MATCHING at ranking time.
  return {
    data: {
      tags: expertiseTags.map((tag) => ({ ...tag })),
      expertiseEdges: expertiseEdges.map((edge) => ({ ...edge, sources: [...edge.sources] })),
      peerHelpProfiles: peerHelpProfiles.map((profile) => ({ ...profile, offeredTagIds: [...profile.offeredTagIds], helpModes: [...profile.helpModes] })),
      trustEdges: trustEdges.map((edge) => ({ ...edge })),
    },
    purpose: "PEER_MATCHING",
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
  const preferredOrder = input.actorId === "hcp-jordan"
    ? ["update-glp1-conversation-guide-v2", "update-diabetes-resource-index-v4", "update-sglt2-monitoring-v3"]
    : ["update-sglt2-monitoring-v3", "update-glp1-conversation-guide-v2", "update-diabetes-resource-index-v4"];
  return {
    data: practiceUpdates
      .filter((update) => update.audienceSpecialties.includes(input.specialty))
      .map((update) => ({
        ...update,
        relevanceReasons: [
          `Matches your ${input.specialty} profile`,
          input.actorId === "hcp-jordan" ? "Related to a topic in your physician update feed" : update.relevanceReasons[1],
        ],
        audienceSpecialties: [...update.audienceSpecialties],
        suggestedTopics: [...update.suggestedTopics],
        provenance: [...update.provenance],
      }))
      .sort((a, b) => preferredOrder.indexOf(a.id) - preferredOrder.indexOf(b.id)),
    purpose: "SELF_INSIGHT",
    decision: allowed(),
  };
}
