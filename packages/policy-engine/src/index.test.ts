import { describe, expect, it } from "vitest";
import { authorizeUse, POLICY_VERSION } from "./index";

describe("authorizeUse", () => {
  it("requires mutual consent before contact details are revealed", () => {
    expect(authorizeUse({ purpose: "PEER_CONTACT", requesterContactConsent: true, recipientContactConsent: false }).decision).toBe("deny");
    expect(authorizeUse({ purpose: "PEER_CONTACT", requesterContactConsent: true, recipientContactConsent: true })).toEqual({
      decision: "allow",
      policyVersion: POLICY_VERSION,
      ruleHits: [],
    });
  });
});
