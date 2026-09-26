import type { HcpProfile, MatchResult, QuestionSelection } from "@relay/domain";
import { authorizeUse } from "@relay/relay-core";

export function assembleQuestion(selection: QuestionSelection): string {
  return `How do peers approach ${selection.topic.toLowerCase()} for ${selection.therapeuticArea} in ${selection.populationBand.toLowerCase()} patients with ${selection.conditionTag.toLowerCase()}?`;
}

export function rankEligiblePeers(selection: QuestionSelection, candidates: HcpProfile[]): MatchResult[] {
  return candidates
    .filter((candidate) => authorizeUse({ purpose: "PEER_MATCHING", candidate }).decision === "allow")
    .map((profile) => {
      const area = profile.therapeuticAreas.includes(selection.therapeuticArea) ? 1 : 0;
      const topic = profile.topics.includes(selection.topic) ? 1 : 0;
      const condition = profile.conditionTags.includes(selection.conditionTag) ? 1 : 0;
      const specialty = profile.specialty === "Endocrinology" ? 1 : 0.72;
      const availability = profile.availability === "available" ? 1 : 0.65;
      const score = area * 0.35 + topic * 0.25 + condition * 0.15 + specialty * 0.1 + profile.responseReliability * 0.1 + profile.timezoneFit * availability * 0.05;
      const reasons = [
        area ? `Opted in to ${selection.therapeuticArea} questions` : "Related therapeutic-area experience",
        condition ? `Physician-provided experience with ${selection.conditionTag.toLowerCase()}` : `${profile.specialty} specialty fit`,
        profile.availability === "available" ? "Available this week with a strong response record" : "Limited availability with a strong response record",
      ];
      return { profile, score, reasons };
    })
    .filter((result) => result.score >= 0.62)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
