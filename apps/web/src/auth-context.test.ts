import { describe, expect, it } from "vitest";
import { webcrypto } from "node:crypto";
import { verifySeededAccount } from "./auth-context";

Object.defineProperty(globalThis, "crypto", { value: webcrypto });

describe("local physician authentication", () => {
  it("accepts the seeded Maya account and rejects an incorrect password", async () => {
    await expect(verifySeededAccount("MAYA.CHEN@RELAY.HEALTH", "Relay2026!")).resolves.toMatchObject({ hcpId: "hcp-maya", email: "maya.chen@relay.health" });
    await expect(verifySeededAccount("maya.chen@relay.health", "wrong-password")).resolves.toBeUndefined();
  });

  it("keeps Elena and Maya attached to different HCP identities", async () => {
    const elena = await verifySeededAccount("elena.ruiz@relay.health", "Relay2026!");
    const maya = await verifySeededAccount("maya.chen@relay.health", "Relay2026!");

    expect(elena?.hcpId).toBe("hcp-1");
    expect(maya?.hcpId).toBe("hcp-maya");
    expect(elena?.hcpId).not.toBe(maya?.hcpId);
  });
});
