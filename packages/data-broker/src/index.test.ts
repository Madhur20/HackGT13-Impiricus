import { describe, expect, it } from "vitest";
import { readClientScope, readConnectCandidates, readMirrorDataset, readPracticeUpdates } from "./index";

describe("demo data broker", () => {
  it("labels every product read with its purpose and policy decision", () => {
    expect(readMirrorDataset()).toMatchObject({ purpose: "SELF_INSIGHT", decision: { decision: "allow" } });
    expect(readConnectCandidates()).toMatchObject({ purpose: "PEER_MATCHING", decision: { decision: "allow" } });
    expect(readClientScope()).toMatchObject({ purpose: "CLIENT_DISCLOSURE", decision: { decision: "allow" } });
    expect(readPracticeUpdates({ actorId: "hcp-maya", specialty: "Endocrinology" })).toMatchObject({ purpose: "SELF_INSIGHT", decision: { decision: "allow" } });
  });

  it("removes ineligible peers before data reaches product ranking", () => {
    expect(readConnectCandidates().data.every((profile) => profile.verified && profile.matchingConsent && profile.availability !== "unavailable")).toBe(true);
  });

  it("returns only updates permitted for the physician specialty", () => {
    const updates = readPracticeUpdates({ actorId: "hcp-maya", specialty: "Endocrinology" }).data;

    expect(updates.length).toBeGreaterThan(0);
    expect(updates.every((update) => update.audienceSpecialties.includes("Endocrinology"))).toBe(true);
    expect(updates.every((update) => update.provenance.some((item) => item.source === "SYNTHETIC"))).toBe(true);
  });
});
