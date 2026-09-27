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
// helped whom"). Ranking is a contextual bandit: the request and each peer's
// expertise evidence form the context, and a Beta posterior over prior
// usefulness feedback estimates the expected reward per peer. Two policies are
// supported: a deterministic UCB (the default, so the demo is reproducible and
// offline) and Thompson sampling (seeded, for stochastic exploration). Hard
// eligibility filters always run before the bandit. No patient data is used.
// See docs/network-graph-plan.md.

export const NETWORK_MATCH_WEIGHTS = {
  expertise: 0.5,
  trust: 0.3,
  specialtyFit: 0.1,
  availabilityFit: 0.1,
};

// Minimum evidence strength required on at least one requested tag to survive
// the expertise stage of the funnel. Prevents ranking on a title alone.
export const EXPERTISE_EVIDENCE_FLOOR = 0.3;

// UCB exploration weight. Kept small so exploration is a gentle tie-breaker on
// the 0.3-weighted trust term rather than something that dominates ranking.
export const DEFAULT_EXPLORATION_C = 0.15;

export type MatchPolicy = "ucb" | "thompson";

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

// --- Seeded RNG and Beta sampler for Thompson sampling (reproducible) ---

function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nextNormal(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Marsaglia-Tsang gamma sampler, valid for shape k >= 1 (our alpha/beta are
// 1 + non-negative counts, so always >= 1).
function sampleGamma(k: number, rng: () => number): number {
  const d = k - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  // Bounded loop; acceptance probability is high, so this returns quickly.
  for (let i = 0; i < 1000; i += 1) {
    const x = nextNormal(rng);
    const v = (1 + c * x) ** 3;
    if (v <= 0) continue;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
  return d; // extremely unlikely fallback
}

function sampleBeta(alpha: number, beta: number, rng: () => number): number {
  const x = sampleGamma(alpha, rng);
  const y = sampleGamma(beta, rng);
  return x / (x + y);
}

// --- Expertise scoring ---

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
  const score = matched.reduce((sum, entry) => sum + entry.strength, 0) / required.length;
  return { score: clamp01(score), matched };
}

// --- Trust / bandit reward estimation ---

function trustStats(candidateId: string, tagIds: string[], trustEdges: TrustEdge[]): { successes: number; interactions: number } {
  const relevant = trustEdges.filter((edge) => edge.toHcpId === candidateId && tagIds.includes(edge.tagId));
  const successes = relevant.reduce((sum, edge) => sum + edge.successfulConnections, 0);
  const interactions = relevant.reduce((sum, edge) => sum + edge.interactions, 0);
  return { successes, interactions };
}

// Deterministic UCB reward estimate: observed success rate plus an exploration
// bonus that shrinks as a peer accrues interactions. When the system has no
// feedback yet (totalInteractions === 0) the bonus is 0, so behavior is stable.
function ucbValue(successes: number, interactions: number, totalInteractions: number, explorationC: number): number {
  const mean = interactions > 0 ? successes / interactions : 0;
  const bonus = totalInteractions > 0 ? explorationC * Math.sqrt(Math.log(totalInteractions + 1) / (interactions + 1)) : 0;
  return clamp01(mean + bonus);
}

// Thompson sampling: draw from the Beta posterior Beta(1 + successes, 1 + failures).
function thompsonValue(successes: number, interactions: number, rng: () => number): number {
  return clamp01(sampleBeta(1 + successes, 1 + (interactions - successes), rng));
}

function buildReasons(
  candidate: HcpProfile,
  matched: { tagId: string; strength: number }[],
  successes: number,
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
  if (successes > 0) reasons.push(`Strong prior peer outcomes (${successes} helpful ${successes === 1 ? "connection" : "connections"})`);
  else reasons.push("Newer peer — surfaced to grow the network");
  reasons.push(`Verified ${candidate.specialty}`);
  if (candidate.availability === "available") reasons.push("Available for peer support");
  return reasons.slice(0, 3);
}

function buildMatch(
  candidate: HcpProfile,
  need: PeerNeed,
  edges: ExpertiseEdge[],
  tags: ExpertiseTag[] | undefined,
  trustValue: number,
  successes: number,
): NetworkMatch {
  const { score: expertiseScore, matched } = expertiseForCandidate(candidate.id, need, edges);
  const specialtyFit = need.specialty ? (candidate.specialty === need.specialty ? 1 : 0.6) : 0.8;
  const availabilityFit = candidate.availability === "available" ? 1 : candidate.availability === "limited" ? 0.6 : 0;

  const score = clamp01(
    expertiseScore * NETWORK_MATCH_WEIGHTS.expertise
    + trustValue * NETWORK_MATCH_WEIGHTS.trust
    + specialtyFit * NETWORK_MATCH_WEIGHTS.specialtyFit
    + availabilityFit * NETWORK_MATCH_WEIGHTS.availabilityFit,
  );

  return {
    profile: candidate,
    score: round(score),
    expertiseScore: round(expertiseScore),
    trustScore: round(trustValue),
    trustConnections: successes,
    matchedTags: matched.map((entry) => ({ tagId: entry.tagId, label: labelFor(tags, entry.tagId) })),
    reasons: buildReasons(candidate, matched, successes, edges, tags),
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
  policy?: MatchPolicy;
  seed?: number;
  explorationC?: number;
};

// The matching funnel. Each stage is a hard filter; ranking only happens after
// all filters, using the contextual bandit on expertise evidence and the
// learned trust posterior.
export function matchPeers(input: MatchPeersInput): NetworkMatchResult {
  const { need } = input;
  const policy = input.policy ?? "ucb";
  const explorationC = input.explorationC ?? DEFAULT_EXPLORATION_C;
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

  // Stage 5: contextual-bandit ranking over the eligible set.
  const stats = eligible.map((candidate) => ({ candidate, ...trustStats(candidate.id, need.expertiseTagIds, input.trustEdges) }));
  const totalInteractions = stats.reduce((sum, entry) => sum + entry.interactions, 0);
  const rng = policy === "thompson" ? createRng(input.seed ?? 1) : null;

  const ranked = stats
    .map(({ candidate, successes, interactions }) => {
      const trustValue = policy === "thompson" && rng
        ? thompsonValue(successes, interactions, rng)
        : ucbValue(successes, interactions, totalInteractions, explorationC);
      return buildMatch(candidate, need, input.expertiseEdges, input.tags, trustValue, successes);
    })
    .sort((a, b) => b.score - a.score);

  const matches = ranked.slice(0, input.limit ?? 3);
  funnel.push({ label: "Strongest matches", count: matches.length });

  return { need, matches, funnel, noMatch: matches.length === 0 };
}

// The learning step. Consented post-connection feedback updates the Beta
// posterior for (expert, topic): a useful outcome (yes/somewhat) is a success,
// "no" is a failure. Returns a new trust-edge list (pure) for the caller to
// persist. Stores no patient data and no off-platform content.
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
