import { describe, expect, it } from "vitest";
import type { AllowedField } from "@relay/domain";
import { computeSchemaDiff, evaluateProposal } from "./index";

const publicField: AllowedField = {
  fieldId: "profile.specialty",
  label: "NPI specialty",
  classification: "public",
  granularity: "individual",
  purpose: "provider_directory",
  retentionDays: 730,
};

describe("Ledger", () => {
  it("produces deterministic semantic diffs", () => {
    const changed = { ...publicField, retentionDays: 365 };
    const added: AllowedField = { ...publicField, fieldId: "profile.state", label: "State" };

    expect(computeSchemaDiff([publicField], [changed, added])).toEqual([
      { operation: "CHANGE_FIELD", fieldId: publicField.fieldId, label: publicField.label, before: publicField, after: changed },
      { operation: "ADD_FIELD", fieldId: added.fieldId, label: added.label, after: added },
    ]);
  });

  it("blocks individual derived disclosure and reviews a safe aggregate", () => {
    const proposed: AllowedField = {
      fieldId: "engagement.topic_score",
      label: "Topic engagement score",
      classification: "derived",
      granularity: "individual",
      purpose: "campaign_measurement",
      retentionDays: 90,
    };

    expect(evaluateProposal(proposed).decision).toBe("deny");
    expect(evaluateProposal({ ...proposed, granularity: "aggregate", minimumGroupSize: 11 }).decision).toBe("review");
  });
});
