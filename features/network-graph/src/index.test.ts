import { describe, expect, it } from "vitest";
import type { ExpertiseEdge, ExpertiseTag, HcpProfile, PeerHelpProfile, PeerNeed, TrustEdge } from "@relay/domain";
import { buildPeerNeed, combineEvidence, matchPeers, recordConnectionOutcome } from "./index";

function makeHcp(id: string, overrides: Partial<HcpProfile> = {}): HcpProfile {
  return {
    id,
    displayName: `Dr. ${id}`,
    specialty: "Cardiology",
    state: "GA",
    therapeuticAreas: [],
    topics: [],
    conditionTags: [],
    availability: "available",
    verified: true,
    matchingConsent: true,
    contactConsent: false,
    responseReliability: 0.9,
    timezoneFit: 1,
    provenance: [],
    ...overrides,
  };
}

const tags: ExpertiseTag[] = [
  { id: "amyloidosis", label: "Cardiac amyloidosis", kind: "condition" },
  { id: "hfpef", label: "HFpEF", kind: "condition" },
];

const candidates: HcpProfile[] = [
  makeHcp("patel"),
  makeHcp("jones"),
  makeHcp("lee"),
  makeHcp("singh"),
  makeHcp("ruiz", { matchingConsent: false }),
  makeHcp("weak"),
];

const expertiseEdges: ExpertiseEdge[] = [
  { hcpId: "patel", tagId: "amyloidosis", sources: ["PUBLICATION", "SELF_DECLARED"] },
  { hcpId: "jones", tagId: "amyloidosis", sources: ["SELF_DECLARED"] },
  { hcpId: "lee", tagId: "hfpef", sources: ["SELF_DECLARED"] },
  { hcpId: "singh", tagId: "amyloidosis", sources: ["SELF_DECLARED"] },
  { hcpId: "ruiz", tagId: "amyloidosis", sources: ["PUBLICATION"] },
  { hcpId: "weak", tagId: "amyloidosis", sources: ["SYNTHETIC"], strength: 0.1 },
];

const peerHelpProfiles: PeerHelpProfile[] = [
  { hcpId: "patel", offeredTagIds: ["amyloidosis"], helpModes: ["async_question"], peerSupportOptIn: true },
  { hcpId: "jones", offeredTagIds: ["amyloidosis"], helpModes: ["async_question"], peerSupportOptIn: true },
  { hcpId: "lee", offeredTagIds: ["hfpef"], helpModes: ["async_question"], peerSupportOptIn: true },
  { hcpId: "singh", offeredTagIds: ["amyloidosis"], helpModes: ["async_question"], peerSupportOptIn: false },
  { hcpId: "ruiz", offeredTagIds: ["amyloidosis"], helpModes: ["async_question"], peerSupportOptIn: true },
  { hcpId: "weak", offeredTagIds: ["amyloidosis"], helpModes: ["async_question"], peerSupportOptIn: true },
];

const need: PeerNeed = { specialty: "Cardiology", expertiseTagIds: ["amyloidosis"], helpMode: "async_question" };

describe("combineEvidence", () => {
  it("rises with corroborating sources and caps at 1", () => {
    const single = combineEvidence(["SELF_DECLARED"]);
    const corroborated = combineEvidence(["SELF_DECLARED", "PUBLICATION"]);
    expect(corroborated).toBeGreaterThan(single);
    expect(combineEvidence(["PUBLICATION", "SELF_DECLARED", "SPECIALTY", "IMPIRICUS_SIGNAL"])).toBeLessThanOrEqual(1);
  });
});

describe("matchPeers funnel", () => {
  it("applies hard filters in order before ranking", () => {
    const result = matchPeers({ need, candidates, expertiseEdges, peerHelpProfiles, trustEdges: [], tags });

    // specialty(6) -> expertise floor(4: patel/jones/singh/ruiz) -> opt-in(3) -> eligible(2) -> matches(2)
    expect(result.funnel.map((step) => step.count)).toEqual([6, 4, 3, 2, 2]);

    const ids = result.matches.map((match) => match.profile.id);
    expect(ids).toEqual(["patel", "jones"]);
    expect(result.matches[0].reasons.some((reason) => reason.includes("publication history"))).toBe(true);
    expect(result.noMatch).toBe(false);
  });

  it("returns an honest no-match instead of weakening filters", () => {
    const result = matchPeers({ need: buildPeerNeed({ specialty: "Cardiology", expertiseTagIds: ["rare-tag"] }), candidates, expertiseEdges, peerHelpProfiles, trustEdges: [] });
    expect(result.noMatch).toBe(true);
    expect(result.matches).toHaveLength(0);
  });
});

describe("recordConnectionOutcome (learning)", () => {
  it("creates then reinforces a trust edge and averages usefulness", () => {
    const first = recordConnectionOutcome({ requesterId: "singh", expertId: "patel", tagId: "amyloidosis", outcome: { useful: "yes", resolution: "resolved" }, trustEdges: [] });
    expect(first.created).toBe(true);
    expect(first.edge).toMatchObject({ interactions: 1, successfulConnections: 1, usefulnessScore: 1 });

    const second = recordConnectionOutcome({ requesterId: "singh", expertId: "patel", tagId: "amyloidosis", outcome: { useful: "somewhat", resolution: "resolved" }, trustEdges: first.trustEdges });
    expect(second.edge).toMatchObject({ interactions: 2, successfulConnections: 2, usefulnessScore: 0.75 });

    const third = recordConnectionOutcome({ requesterId: "singh", expertId: "patel", tagId: "amyloidosis", outcome: { useful: "no", resolution: "need_another_expert" }, trustEdges: second.trustEdges });
    expect(third.edge).toMatchObject({ interactions: 3, successfulConnections: 2, usefulnessScore: 0.5 });
  });

  it("improves a peer's match score after positive feedback (the flywheel)", () => {
    const before = matchPeers({ need, candidates, expertiseEdges, peerHelpProfiles, trustEdges: [], tags });
    const jonesBefore = before.matches.find((match) => match.profile.id === "jones");
    expect(jonesBefore?.trustConnections).toBe(0);

    // Five different physicians report useful help from jones on amyloidosis.
    let trustEdges: TrustEdge[] = [];
    for (const requester of ["a", "b", "c", "d", "e"]) {
      trustEdges = recordConnectionOutcome({ requesterId: requester, expertId: "jones", tagId: "amyloidosis", outcome: { useful: "yes", resolution: "resolved" }, trustEdges }).trustEdges;
    }

    const after = matchPeers({ need, candidates, expertiseEdges, peerHelpProfiles, trustEdges, tags });
    const jonesAfter = after.matches.find((match) => match.profile.id === "jones");
    expect(jonesAfter?.trustConnections).toBe(5);
    expect(jonesAfter?.trustScore).toBeGreaterThan(0);
    expect((jonesAfter?.score ?? 0)).toBeGreaterThan(jonesBefore?.score ?? 0);
  });
});
