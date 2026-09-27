import { describe, expect, it } from "vitest";
import { mirrorClassesByPersona } from "@relay/demo-seed";
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

  it("personalizes update ordering and keeps four eligible specialists per update", () => {
    const maya = readPracticeUpdates({ actorId: "hcp-maya", specialty: "Endocrinology" }).data;
    const jordan = readPracticeUpdates({ actorId: "hcp-jordan", specialty: "Internal Medicine" }).data;
    const eligibleIds = new Set(readConnectCandidates().data.map((profile) => profile.id));

    expect(maya[0].id).not.toBe(jordan[0].id);
    expect(mirrorClassesByPersona["hcp-maya"][0].subject).not.toBe(mirrorClassesByPersona["hcp-jordan"][0].subject);
    expect(maya[0].relevanceReasons[0]).toContain("Endocrinology");
    expect(jordan[0].relevanceReasons[0]).toContain("Internal Medicine");
    expect([...maya, ...jordan].every((update) => update.specialistIds.length === 4)).toBe(true);
    expect([...maya, ...jordan].every((update) => update.specialistIds.every((id) => eligibleIds.has(id)))).toBe(true);
  });
});
