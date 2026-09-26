import { describe, expect, it } from "vitest";
import { hcpProfiles } from "@relay/demo-seed";
import type { QuestionSelection } from "@relay/domain";
import { assembleQuestion, rankEligiblePeers } from "./index";

const selection: QuestionSelection = {
  therapeuticArea: "GLP-1 therapies",
  topic: "Initiation",
  populationBand: "Older adult",
  conditionTag: "Renal impairment",
};

describe("Doctor Connect", () => {
  it("assembles a bounded, structured question", () => {
    expect(assembleQuestion(selection)).toContain("initiation for GLP-1 therapies");
    expect(assembleQuestion(selection)).toContain("renal impairment");
  });

  it("filters ineligible peers before ranking", () => {
    const results = rankEligiblePeers(selection, hcpProfiles);

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results.every(({ profile }) => profile.verified && profile.matchingConsent && profile.availability !== "unavailable")).toBe(true);
    expect(results.map(({ score }) => score)).toEqual([...results.map(({ score }) => score)].sort((a, b) => b - a));
  });
});
