import { describe, expect, it } from "vitest";
import { hcpProfiles } from "@relay/demo-seed";
import type { QuestionSelection } from "@relay/domain";
import { ANSWER_APPROACHES, ageToPopulationBand, assembleQuestion, assembleStructuredAnswer, assertSafeQuestionSelection, inferMatchingTagIds, isValidStructuredAnswer, prepareAnswerText, prepareQuestionSelection, rankEligiblePeers, reviewAnswerText, reviewQuestionField, reviewQuestionSelection } from "./index";

const selection: QuestionSelection = {
  therapeuticArea: "GLP-1 receptor agonists",
  topic: "Dosing and titration",
  populationBand: "Adults 65–89",
  conditionTag: "Renal impairment",
};

describe("Doctor Connect", () => {
  it("assembles a bounded, structured question", () => {
    expect(assembleQuestion(selection)).toContain("Dosing and titration for GLP-1 receptor agonists");
    expect(assembleQuestion(selection)).toContain("Renal impairment");
  });

  it("filters ineligible peers before ranking", () => {
    const results = rankEligiblePeers(selection, hcpProfiles);

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results.every(({ profile }) => profile.verified && profile.matchingConsent && profile.availability !== "unavailable")).toBe(true);
    expect(results.map(({ score }) => score)).toEqual([...results.map(({ score }) => score)].sort((a, b) => b - a));
  });

  it("preserves a two-digit age while typing and generalizes it only for the reviewed question", () => {
    const entered = { therapeuticArea: "Jardiance", topic: "kidney checks after starting", populationBand: "72", conditionTag: "CKD" };
    const review = reviewQuestionSelection(entered);
    expect(entered.populationBand).toBe("72");
    expect(review.status).toBe("ready");
    expect(review.fields.populationBand).toMatchObject({ reviewedValue: "Adults 65–89", generalized: true });
    expect(review.approvedSelection.populationBand).toBe("Adults 65–89");
    expect(prepareQuestionSelection(entered).populationBand).toBe("Adults 65–89");
    expect(assembleQuestion(entered)).toBe("How do peers approach kidney checks after starting for Jardiance in Adults 65–89 patients with CKD?");
    expect(inferMatchingTagIds(entered)).toEqual(expect.arrayContaining(["sglt2", "renal_impairment"]));
  });

  it("maps common exact-age formats into coarse ranges", () => {
    expect(ageToPopulationBand(4)).toBe("Children and adolescents under 18");
    expect(ageToPopulationBand(25)).toBe("Adults 18–39");
    expect(ageToPopulationBand(55)).toBe("Adults 40–64");
    expect(ageToPopulationBand(72)).toBe("Adults 65–89");
    expect(ageToPopulationBand(95)).toBe("Adults 90+");
    expect(reviewQuestionField("populationBand", "age 72").reviewedValue).toBe("Adults 65–89");
    expect(reviewQuestionField("populationBand", "72-year-old").reviewedValue).toBe("Adults 65–89");
    expect(reviewQuestionField("populationBand", "Adults 65–89").reviewedValue).toBe("Adults 65–89");
  });

  it("blocks likely personal identifiers without silently changing the entered field", () => {
    const entered = "CKD — call the patient at 404-555-0199";
    const review = reviewQuestionField("conditionTag", entered);
    expect(review.status).toBe("needs_changes");
    expect(review.issues).toContain("phone");
    expect(review.redactedPreview).toBe("CKD — call the patient at [phone removed]");
    expect(entered).toContain("404-555-0199");
  });

  it("detects each supported direct-identifier class", () => {
    const examples = [
      ["topic", "email me at patient@example.com", "email"],
      ["topic", "patient at example dot com", "email"],
      ["topic", "call 4045550199", "phone"],
      ["topic", "seen on 09/26/2026", "date"],
      ["topic", "seen January 3, 2024", "date"],
      ["topic", "seen 3 January 2024", "date"],
      ["topic", "born in 1952", "date"],
      ["conditionTag", "MRN 1234-ABCD", "record_id"],
      ["conditionTag", "claim ID ABC-123", "record_id"],
      ["conditionTag", "NPI 1234567890", "record_id"],
      ["conditionTag", "SSN 123-45-6789", "government_id"],
      ["conditionTag", "lives at 123 Main Street", "street_address"],
      ["conditionTag", "send to PO Box 123", "street_address"],
      ["conditionTag", "ZIP 30332", "precise_location"],
      ["conditionTag", "contact @patient_name", "online_identifier"],
      ["conditionTag", "IP 192.168.1.42", "online_identifier"],
      ["conditionTag", "patient named John Smith", "named_person"],
      ["conditionTag", "Dr. John Smith has the records", "named_person"],
      ["conditionTag", "my mother jane smith", "named_person"],
      ["conditionTag", "bob has renal impairment", "named_person"],
      ["topic", "72-year-old with CKD", "exact_age"],
      ["populationBand", "72 with CKD", "exact_age"],
    ] as const;
    for (const [field, value, issue] of examples) expect(reviewQuestionField(field, value).issues).toContain(issue);
  });

  it("blocks a person's name when it appears in clinical free text", () => {
    const examples = [
      ["Bob has renal impairment", "[name removed] has renal impairment"],
      ["Maya Chen takes Jardiance", "[name removed] takes Jardiance"],
      ["my patient Elena has CKD", "[name removed] has CKD"],
      ["Bob's renal function declined", "[name removed] renal function declined"],
      ["bob's Renal impairment", "[name removed] Renal impairment"],
      ["Maya’s CKD monitoring", "[name removed] CKD monitoring"],
      ["Renal impairment for bob", "Renal impairment [name removed]"],
      ["CKD in maya chen", "CKD [name removed]"],
      ["Monitoring regarding John", "Monitoring [name removed]"],
      ["Bob: renal impairment", "[name removed]: renal impairment"],
    ] as const;

    for (const [entered, redacted] of examples) {
      const review = reviewQuestionField("conditionTag", entered);
      expect(review.status).toBe("needs_changes");
      expect(review.issues).toEqual(["named_person"]);
      expect(review.redactedPreview).toBe(redacted);
      expect(entered).not.toContain("[name removed]");
    }

    const unsafeQuestion = { ...selection, conditionTag: "Bob has renal impairment" };
    expect(reviewQuestionSelection(unsafeQuestion).status).toBe("needs_changes");
    expect(() => assertSafeQuestionSelection(unsafeQuestion)).toThrow(/privacy or safety changes/);
  });

  it("stops safety-event text at the storage boundary", () => {
    const unsafe = { ...selection, conditionTag: "suspected adverse event" };
    expect(reviewQuestionSelection(unsafe).safetyStop).toBe(true);
    expect(() => assertSafeQuestionSelection(unsafe)).toThrow(/privacy or safety changes/);
  });

  it("reconstructs an enum-only response and rejects an invalid array member", () => {
    const answer = {
      approach: "Confirm treatment goals and relevant comorbidities" as const,
      monitoring: ["Renal trend", "Tolerance"] as const,
      escalation: "Specialist or care-team review" as const,
    };
    expect(assembleStructuredAnswer({ ...answer, monitoring: [...answer.monitoring] })).toBe("Approach: Confirm treatment goals and relevant comorbidities. Monitoring: Renal trend, Tolerance. Escalation: Specialist or care-team review.");
    expect(isValidStructuredAnswer({ ...answer, monitoring: ["Renal trend", "Patient John Smith"] as never[] })).toBe(false);
    expect(isValidStructuredAnswer({ approach: "Legacy free-text answer", monitoring: ["Renal trend"], escalation: "No escalation needed" })).toBe(false);
    expect(isValidStructuredAnswer({ approach: ANSWER_APPROACHES[0] })).toBe(false);
  });

  it("reviews responder free text with the same privacy boundary", () => {
    const safe = "In my practice, I review baseline renal trends and follow up on tolerance before adjusting the monitoring cadence.";
    expect(reviewAnswerText(safe)).toMatchObject({ status: "ready", safetyStop: false, reviewedValue: safe });
    expect(prepareAnswerText(`  ${safe}  `)).toBe(safe);

    for (const unsafe of [
      "Bob's renal impairment changed my approach.",
      "Renal impairment for bob required follow-up.",
      "The 72-year-old patient needed closer monitoring.",
      "Call me at 404-555-0199.",
      "Review MRN 1234-ABCD.",
    ]) {
      expect(reviewAnswerText(unsafe).status).toBe("needs_changes");
      expect(() => prepareAnswerText(unsafe)).toThrow(/privacy or safety changes/);
    }

    const safetyEvent = "This may be an adverse event.";
    expect(reviewAnswerText(safetyEvent).safetyStop).toBe(true);
    expect(() => prepareAnswerText(safetyEvent)).toThrow(/privacy or safety changes/);
  });
});
