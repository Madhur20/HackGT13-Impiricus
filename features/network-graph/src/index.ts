import type {
  ConnectionOutcome,
  ExpertiseEdge,
  ExpertiseSource,
  ExpertiseTag,
  HcpProfile,
  MatchFunnelStep,
  NetworkMatch,
  NetworkMatchResult,
  PeerHelpProfile,
  PeerNeed,
  TrustEdge,
} from "@relay/domain";
import { authorizeUse } from "@relay/relay-core";

// The Relay Network Graph matches a physician to the right peer using an
// expertise graph ("who knows what") and a trust graph ("who has successfully
// helped whom"). Matching is deterministic and keeps Doctor Connect's rule that
// hard filters precede ranking. The graph learns from consented post-connection
// feedback. It never reads or stores patient data. See docs/network-graph-plan.md.

export const NETWORK_MATCH_WEIGHTS = {
  expertise: 0.5,
  trust: 0.3,
  specialtyFit: 0.1,
  availabilityFit: 0.1,
};

// Minimum evidence strength required on at least one requested tag to survive
// the expertise stage of the funnel. Prevents ranking on a title alone.
export const EXPERTISE_EVIDENCE_FLOOR = 0.3;

// Number of successful connections at which trust weight saturates, so one
// lucky interaction cannot dominate the ranking.
export const TRUST_SATURATION = 5;

// Per-source evidence contribution. Independent sources compound so that
// corroborated expertise is stronger than a single self-declaration.
const SOURCE_WEIGHTS: Record<ExpertiseSource, number> = {
  PUBLICATION: 0.5,
  SELF_DECLARED: 0.4,
  IMPIRICUS_SIGNAL: 0.35,
  SPECIALTY: 0.3,
  SYNTHETIC: 0.3,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Number(value.toFixed(4));
}

// Combine independent evidence sources: 1 - prod(1 - w). More corroboration
// raises confidence but never exceeds 1.
export function combineEvidence(sources: ExpertiseSource[]): number {
  const product = sources.reduce((acc, source) => acc * (1 - (SOURCE_WEIGHTS[source] ?? 0)), 1);
  return clamp01(1 - product);
}

export function edgeStrength(edge: ExpertiseEdge): number {
  if (typeof edge.strength === "number") return clamp01(edge.strength);
  return combineEvidence(edge.sources);
}

function labelFor(tags: ExpertiseTag[] | undefined, tagId: string): string {
  return tags?.find((tag) => tag.id === tagId)?.label ?? tagId;
}

function expertiseForCandidate(
  candidateId: string,
  need: PeerNeed,
  edges: ExpertiseEdge[],
): { score: number; matched: { tagId: string; strength: number }[] } {
  const required = need.expertiseTagIds;
  if (required.length === 0) return { score: 0, matched: [] };

  const matched = required
    .map((tagId) => {
      const edge = edges.find((item) => item.hcpId === candidateId && item.tagId === tagId);
      return edge ? { tagId, strength: edgeStrength(edge) } : null;
    })
    .filter((entry): entry is { tagId: string; strength: number } => entry !== null);

  if (matched.length === 0) return { score: 0, matched: [] };
  // Average strength over all requested tags, so covering more of the request
  // (with stronger evidence) scores higher.
  const score = matched.reduce((sum, entry) => sum + entry.strength, 0) / required.length;
  return { score: clamp01(score), matched };
}

function trustForCandidate(
  candidateId: string,
  tagIds: string[],
  trustEdges: TrustEdge[],
): { score: number; connections: number } {
  const relevant = trustEdges.filter((edge) => edge.toHcpId === candidateId && tagIds.includes(edge.tagId));
  const connections = relevant.reduce((sum, edge) => sum + edge.successfulConnections, 0);
  if (connections === 0) return { score: 0, connections: 0 };

  const weightedUsefulness = relevant.reduce((sum, edge) => sum + edge.usefulnessScore * edge.successfulConnections, 0) / connections;
  const saturation = Math.min(1, connections / TRUST_SATURATION);
  return { score: clamp01(weightedUsefulness * saturation), connections };
}

function buildReasons(
  candidate: HcpProfile,
  matched: { tagId: string; strength: number }[],
  trust: { connections: number },
  edges: ExpertiseEdge[],
  tags: ExpertiseTag[] | undefined,
): string[] {
  const reasons: string[] = [];
  const top = [...matched].sort((a, b) => b.strength - a.strength)[0];
  if (top) {
    const edge = edges.find((item) => item.hcpId === candidate.id && item.tagId === top.tagId);
    const label = labelFor(tags, top.tagId);
    if (edge?.sources.includes("PUBLICATION")) reasons.push(`Relevant ${label} publication history`);
    else if (edge?.sources.includes("SELF_DECLARED")) reasons.push(`Self-reported ${label} expertise`);
    else reasons.push(`${label} expertise`);
  }
  if (trust.connections > 0) {
    reasons.push(`Strong prior peer outcomes (${trust.connections} helpful ${trust.connections === 1 ? "connection" : "connections"})`);
  }
  reasons.push(`Verified ${candidate.specialty}`);
  if (candidate.availability === "available") reasons.push("Available for peer support");
  return reasons.slice(0, 3);
}

function buildMatch(
  candidate: HcpProfile,
  need: PeerNeed,
  edges: ExpertiseEdge[],
  trustEdges: TrustEdge[],
  tags: ExpertiseTag[] | undefined,
): NetworkMatch {
  const { score: expertiseScore, matched } = expertiseForCandidate(candidate.id, need, edges);
  const trust = trustForCandidate(candidate.id, need.expertiseTagIds, trustEdges);
  const specialtyFit = need.specialty ? (candidate.specialty === need.specialty ? 1 : 0.6) : 0.8;
  const availabilityFit = candidate.availability === "available" ? 1 : candidate.availability === "limited" ? 0.6 : 0;

  const score = clamp01(
    expertiseScore * NETWORK_MATCH_WEIGHTS.expertise
    + trust.score * NETWORK_MATCH_WEIGHTS.trust
    + specialtyFit * NETWORK_MATCH_WEIGHTS.specialtyFit
    + availabilityFit * NETWORK_MATCH_WEIGHTS.availabilityFit,
  );

  return {
    profile: candidate,
    score: round(score),
    expertiseScore: round(expertiseScore),
    trustScore: round(trust.score),
    trustConnections: trust.connections,
    matchedTags: matched.map((entry) => ({ tagId: entry.tagId, label: labelFor(tags, entry.tagId) })),
    reasons: buildReasons(candidate, matched, trust, edges, tags),
  };
}

export type MatchPeersInput = {
  need: PeerNeed;
  candidates: HcpProfile[];
  expertiseEdges: ExpertiseEdge[];
  peerHelpProfiles: PeerHelpProfile[];
  trustEdges: TrustEdge[];
  tags?: ExpertiseTag[];
  limit?: number;
};

// The matching funnel. Each stage is a hard filter; ranking only happens after
// all filters, on expertise evidence and validated trust.
export function matchPeers(input: MatchPeersInput): NetworkMatchResult {
  const { need } = input;
  const helpById = new Map(input.peerHelpProfiles.map((profile) => [profile.hcpId, profile]));
  const funnel: MatchFunnelStep[] = [];

  // Stage 1: specialty pool.
  const specialtyPool = need.specialty
    ? input.candidates.filter((candidate) => candidate.specialty === need.specialty)
    : [...input.candidates];
  funnel.push({ label: need.specialty ? `${need.specialty} physicians` : "Physicians", count: specialtyPool.length });

  // Stage 2: required-expertise match above the evidence floor.
  const withExpertise = specialtyPool.filter((candidate) => {
    const { matched } = expertiseForCandidate(candidate.id, need, input.expertiseEdges);
    return matched.some((entry) => entry.strength >= EXPERTISE_EVIDENCE_FLOOR);
  });
  const tagLabels = need.expertiseTagIds.map((tagId) => labelFor(input.tags, tagId)).join(", ");
  funnel.push({ label: `Connected to ${tagLabels || "the topic"}`, count: withExpertise.length });

  // Stage 3: peer-support opt-in and requested help mode.
  const optedIn = withExpertise.filter((candidate) => {
    const help = helpById.get(candidate.id);
    if (!help || !help.peerSupportOptIn) return false;
    if (need.helpMode && !help.helpModes.includes(need.helpMode)) return false;
    return true;
  });
  funnel.push({ label: "Opted into peer support", count: optedIn.length });

  // Stage 4: hard eligibility (verified + active matching consent + available),
  // enforced by the shared policy engine.
  const eligible = optedIn.filter((candidate) => authorizeUse({ purpose: "PEER_MATCHING", candidate }).decision === "allow");
  funnel.push({ label: "Verified, consented, available", count: eligible.length });

  // Stage 5: rank the survivors and take the strongest matches.
  const ranked = eligible
    .map((candidate) => buildMatch(candidate, need, input.expertiseEdges, input.trustEdges, input.tags))
    .sort((a, b) => b.score - a.score);
  const matches = ranked.slice(0, input.limit ?? 3);
  funnel.push({ label: "Strongest matches", count: matches.length });

  return { need, matches, funnel, noMatch: matches.length === 0 };
}

// The learning step. Consented post-connection feedback creates or reinforces a
// trust edge from requester to expert on a topic. Returns a new trust-edge list
// (pure) so the caller can persist it. Stores no patient data.
export function recordConnectionOutcome(input: {
  requesterId: string;
  expertId: string;
  tagId: string;
  outcome: ConnectionOutcome;
  trustEdges: TrustEdge[];
  now?: string;
}): { trustEdges: TrustEdge[]; edge: TrustEdge; created: boolean } {
  const usefulnessValue = input.outcome.useful === "yes" ? 1 : input.outcome.useful === "somewhat" ? 0.5 : 0;
  const isSuccess = usefulnessValue > 0;
  const now = input.now ?? new Date().toISOString();

  const index = input.trustEdges.findIndex(
    (edge) => edge.fromHcpId === input.requesterId && edge.toHcpId === input.expertId && edge.tagId === input.tagId,
  );

  if (index === -1) {
    const edge: TrustEdge = {
      fromHcpId: input.requesterId,
      toHcpId: input.expertId,
      tagId: input.tagId,
      interactions: 1,
      successfulConnections: isSuccess ? 1 : 0,
      usefulnessScore: round(usefulnessValue),
      lastConnectedAt: now,
    };
    return { trustEdges: [...input.trustEdges, edge], edge, created: true };
  }

  const previous = input.trustEdges[index];
  const interactions = previous.interactions + 1;
  const edge: TrustEdge = {
    ...previous,
    interactions,
    successfulConnections: previous.successfulConnections + (isSuccess ? 1 : 0),
    usefulnessScore: round((previous.usefulnessScore * previous.interactions + usefulnessValue) / interactions),
    lastConnectedAt: now,
  };
  const trustEdges = input.trustEdges.map((existing, i) => (i === index ? edge : existing));
  return { trustEdges, edge, created: false };
}

// Assemble a validated PeerNeed from a governed categorical selection. This is
// the deterministic path; a future Gemini intent extractor would fall back to
// this and could never widen eligibility.
export function buildPeerNeed(selection: {
  specialty?: string;
  expertiseTagIds: string[];
  helpMode?: PeerNeed["helpMode"];
}): PeerNeed {
  return {
    specialty: selection.specialty,
    expertiseTagIds: [...new Set(selection.expertiseTagIds)].filter(Boolean),
    helpMode: selection.helpMode,
  };
}
