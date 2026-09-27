import { describe, expect, it } from "vitest";
import { hcpProfiles, prescribingProfiles } from "@relay/demo-seed";
import { clusterDoctorsByDomain, cosineSimilarity, suggestDomainPeers, suggestSimilarPrescribers } from "./index";

describe("clusterDoctorsByDomain", () => {
  it("is deterministic across runs with the same seed", () => {
    const first = clusterDoctorsByDomain(prescribingProfiles);
    const second = clusterDoctorsByDomain(prescribingProfiles);
    expect(second.assignments).toEqual(first.assignments);
    expect(second.clusters.map((cluster) => cluster.memberIds)).toEqual(first.clusters.map((cluster) => cluster.memberIds));
  });

  it("partitions every physician into exactly one of k clusters", () => {
    const result = clusterDoctorsByDomain(prescribingProfiles, { k: 3 });
    expect(result.clusters).toHaveLength(3);
    const totalMembers = result.clusters.reduce((sum, cluster) => sum + cluster.size, 0);
    expect(totalMembers).toBe(prescribingProfiles.length);
    expect(result.assignments).toHaveLength(prescribingProfiles.length);
  });

  it("recovers the seeded latent domains and labels them descriptively", () => {
    const result = clusterDoctorsByDomain(prescribingProfiles, { k: 3 });
    // Each cluster should have a dominant class that reflects one archetype.
    const dominantClassIds = new Set(result.clusters.map((cluster) => cluster.dominantClasses[0]?.classId));
    expect(dominantClassIds.size).toBeGreaterThan(1);
    for (const cluster of result.clusters) {
      expect(cluster.label).toMatch(/domain/);
    }
  });
});

describe("suggestDomainPeers", () => {
  it("suggests co-clustered peers ranked by similarity and gated by matching consent", () => {
    const clustering = clusterDoctorsByDomain(prescribingProfiles);
    const suggestions = suggestDomainPeers({
      subjectId: "hcp-maya",
      profiles: prescribingProfiles,
      candidates: hcpProfiles,
      clustering,
      limit: 4,
    });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(4);

    // Never suggests the subject.
    expect(suggestions.every((suggestion) => suggestion.profile.id !== "hcp-maya")).toBe(true);

    // Only eligible (verified, consented, available) peers appear.
    expect(suggestions.every((suggestion) => suggestion.profile.verified && suggestion.profile.matchingConsent && suggestion.profile.availability !== "unavailable")).toBe(true);

    // Suggestions come from the subject's own cluster.
    const subjectCluster = clustering.assignments.find((assignment) => assignment.hcpId === "hcp-maya")?.clusterId;
    expect(suggestions.every((suggestion) => suggestion.clusterId === subjectCluster)).toBe(true);

    // Sorted by descending similarity, each a valid 0-1 value.
    const scores = suggestions.map((suggestion) => suggestion.similarity);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(scores.every((score) => score >= 0 && score <= 1)).toBe(true);

    // Every suggestion exposes at most three explanation reasons.
    expect(suggestions.every((suggestion) => suggestion.reasons.length > 0 && suggestion.reasons.length <= 3)).toBe(true);
  });

  it("excludes a peer once matching consent is revoked", () => {
    const clustering = clusterDoctorsByDomain(prescribingProfiles);
    const baseline = suggestDomainPeers({ subjectId: "hcp-maya", profiles: prescribingProfiles, candidates: hcpProfiles, clustering });
    const targetId = baseline[0]?.profile.id;
    expect(targetId).toBeDefined();

    const revokedCandidates = hcpProfiles.map((candidate) => (candidate.id === targetId ? { ...candidate, matchingConsent: false } : candidate));
    const afterRevoke = suggestDomainPeers({ subjectId: "hcp-maya", profiles: prescribingProfiles, candidates: revokedCandidates, clustering });

    expect(afterRevoke.some((suggestion) => suggestion.profile.id === targetId)).toBe(false);
  });
});

describe("suggestSimilarPrescribers", () => {
  it("returns consented peers whose share for one drug is closest to the subject's", () => {
    const suggestions = suggestSimilarPrescribers({
      subjectId: "hcp-maya",
      classId: "sglt2",
      profiles: prescribingProfiles,
      candidates: hcpProfiles,
      limit: 4,
      tolerance: 1,
    });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(4);
    expect(suggestions.every((suggestion) => suggestion.profile.id !== "hcp-maya")).toBe(true);
    expect(suggestions.every((suggestion) => suggestion.profile.verified && suggestion.profile.matchingConsent && suggestion.profile.availability !== "unavailable")).toBe(true);
    expect(suggestions.every((suggestion) => suggestion.classId === "sglt2")).toBe(true);

    // Sorted by ascending share difference (closest first).
    const diffs = suggestions.map((suggestion) => suggestion.shareDifference);
    expect(diffs).toEqual([...diffs].sort((a, b) => a - b));
    expect(suggestions.every((suggestion) => suggestion.similarity >= 0 && suggestion.similarity <= 1)).toBe(true);
  });

  it("honors the tolerance window", () => {
    const tight = suggestSimilarPrescribers({ subjectId: "hcp-maya", classId: "sglt2", profiles: prescribingProfiles, candidates: hcpProfiles, tolerance: 0.01 });
    const wide = suggestSimilarPrescribers({ subjectId: "hcp-maya", classId: "sglt2", profiles: prescribingProfiles, candidates: hcpProfiles, tolerance: 1 });
    expect(wide.length).toBeGreaterThanOrEqual(tight.length);
    expect(tight.every((suggestion) => suggestion.shareDifference <= 0.01)).toBe(true);
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors and 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([0.5, 0.5], [0.5, 0.5])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
});
